# -----------------------------------------------------------------------------
# File: kendra_client.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: AWS Kendra client for querying relevant document chunks from S3
# -----------------------------------------------------------------------------

import boto3
from botocore.exceptions import ClientError, BotoCoreError
import os
from dotenv import load_dotenv
from typing import List, Dict

load_dotenv()

# AWS Kendra Configuration from environment variables
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
KENDRA_INDEX_ID = os.getenv("KENDRA_INDEX_ID", "")
# Temporary: Set to "true" to disable filtering for debugging
KENDRA_DISABLE_FILTERING = os.getenv("KENDRA_DISABLE_FILTERING", "false").lower() == "true"

# Check if Kendra is configured
KENDRA_ENABLED = bool(AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and KENDRA_INDEX_ID)

# Create Kendra client if credentials are available
kendra_client = None
if KENDRA_ENABLED:
    try:
        kendra_client = boto3.client(
            'kendra',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        print("Kendra client initialized successfully.")
    except Exception as e:
        print(f"Error initializing Kendra client: {e}")
        kendra_client = None
        KENDRA_ENABLED = False
else:
    print("Warning: AWS Kendra is not fully configured. Kendra functionality will be disabled.")
    print("Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and KENDRA_INDEX_ID in your .env file.")


def _is_quality_result(result: Dict, question: str, min_excerpt_length: int = 50) -> bool:
    """
    Check if a Kendra result is of sufficient quality to be included.
    Filters out results that only contain question keywords without substantial content.
    
    Args:
        result: Kendra result dictionary
        question: Original question asked
        min_excerpt_length: Minimum excerpt length in characters (default: 50)
    
    Returns:
        True if result is of sufficient quality, False otherwise
    """
    excerpt = result.get("excerpt", "").strip()
    
    # Check 1: Excerpt must have minimum length
    if len(excerpt) < min_excerpt_length:
        return False
    
    # Check 2: Relevance score should be HIGH or MEDIUM (exclude LOW)
    relevance_score = result.get("relevance_score", "MEDIUM")
    if relevance_score == "LOW":
        return False
    
    # Check 3: Excerpt should contain substantial content beyond just question words
    # Extract meaningful words from question (exclude common words)
    question_lower = question.lower()
    question_words = [w.strip() for w in question_lower.split() if len(w.strip()) > 2]
    # Remove common stop words
    stop_words = {"the", "what", "are", "is", "how", "why", "when", "where", "can", "does", "do", "did", "will", "would", "should", "could"}
    question_keywords = [w for w in question_words if w not in stop_words]
    
    # Check if excerpt contains more than just question keywords
    excerpt_lower = excerpt.lower()
    
    # Count how many question keywords appear in excerpt
    keyword_matches = sum(1 for keyword in question_keywords if keyword in excerpt_lower)
    
    # If excerpt only contains question keywords (high keyword ratio), it's likely not useful
    # We want excerpts that have substantial content beyond just matching keywords
    if question_keywords:
        keyword_ratio = keyword_matches / len(question_keywords)
        # If more than 80% of keywords match but excerpt is still short, it's likely just keyword matching
        if keyword_ratio > 0.8 and len(excerpt) < 100:
            return False
    
    # Check 4: Excerpt should have some sentence structure (contains periods, or multiple words)
    # Very short excerpts that are just keywords are not useful
    word_count = len(excerpt.split())
    if word_count < 10:  # Less than 10 words is likely not substantial
        return False
    
    # Check 5: Excerpt should not be mostly whitespace or special characters
    alphanumeric_chars = sum(1 for c in excerpt if c.isalnum())
    if alphanumeric_chars < len(excerpt) * 0.5:  # Less than 50% alphanumeric
        return False
    
    return True


def query_kendra(
    question: str,
    university_id: int,
    subject_id: int,
    max_results: int = 5,
    disable_filtering: bool = False
) -> List[Dict]:
    """
    Query AWS Kendra index with a question and filter by university and subject.
    
    Uses S3 key filtering to ensure only relevant documents are retrieved.
    S3 Key Format: universities/{university_id}/branches/{branch_id}/subjects/{subject_id}/materials/{uuid}.pdf
    
    Args:
        question: The student's question
        university_id: University ID for filtering
        subject_id: Subject ID for filtering
        max_results: Maximum number of results to return (default: 5)
    
    Returns:
        List of dictionaries containing:
        - excerpt: The relevant text excerpt
        - document_title: Title of the source document
        - document_uri: S3 URI of the document
        - relevance_score: Relevance score from Kendra
    
    Raises:
        ValueError: If Kendra is not configured
        Exception: If there's an error querying Kendra
    """
    if not KENDRA_ENABLED or not kendra_client:
        raise ValueError("Kendra is not configured. Please check your environment variables.")
    
    try:
        # Query Kendra (we'll filter by S3 URI pattern after getting results)
        # This approach is more reliable than using attribute filters for S3 URIs
        # Kendra uses PageSize instead of MaxResults
        # Request additional attributes to get page numbers if available
        response = kendra_client.query(
            IndexId=KENDRA_INDEX_ID,
            QueryText=question,
            PageSize=max_results * 3,  # Get more results to filter from
            RequestedDocumentAttributes=["_source_uri", "_document_title"]  # Request additional metadata
        )
        
        # Extract and filter results by S3 key pattern
        # S3 Key Format: universities/{university_id}/branches/{branch_id}/subjects/{subject_id}/materials/{uuid}.pdf
        # Kendra returns URIs in format: s3://bucket-name/universities/... or just the key path
        s3_university_pattern = f"universities/{university_id}/"
        s3_subject_pattern = f"subjects/{subject_id}/"
        
        results = []
        total_items = 0
        filtered_out = 0
        
        if "ResultItems" in response:
            total_items = len(response["ResultItems"])
            
            for item in response["ResultItems"]:
                document_uri = item.get("DocumentURI", "")
                
                # Extract the key part from various URI formats
                # Kendra may return:
                # - s3://bucket-name/universities/1/...
                # - https://bucket-name.s3.amazonaws.com/universities/1/...
                # - https://bucket-name.s3.region.amazonaws.com/universities/1/...
                # - Just the key path: universities/1/...
                uri_to_check = document_uri
                
                if document_uri.startswith("s3://"):
                    # Extract key from s3://bucket/key format
                    parts = document_uri.split("/", 3)
                    if len(parts) >= 4:
                        uri_to_check = parts[3]  # Get the key part after bucket name
                elif document_uri.startswith("https://"):
                    # Extract key from HTTPS URL format
                    # Format: https://bucket-name.s3.amazonaws.com/key or
                    #         https://bucket-name.s3.region.amazonaws.com/key
                    try:
                        from urllib.parse import urlparse
                        parsed = urlparse(document_uri)
                        # Remove leading slash from path
                        uri_to_check = parsed.path.lstrip("/")
                    except Exception:
                        # Fallback: try to extract after .amazonaws.com/
                        if ".amazonaws.com" in document_uri:
                            # Find the path after .amazonaws.com/
                            parts = document_uri.split(".amazonaws.com/", 1)
                            if len(parts) == 2:
                                uri_to_check = parts[1]
                        elif ".s3." in document_uri:
                            # Find the path after .s3.region.amazonaws.com/
                            parts = document_uri.split(".s3.", 1)
                            if len(parts) == 2:
                                # Extract path after .amazonaws.com/ or .s3.region.amazonaws.com/
                                path_start = parts[1].find("/")
                                if path_start != -1:
                                    uri_to_check = parts[1][path_start + 1:]
                
                # Check if patterns match
                has_university = s3_university_pattern in uri_to_check
                has_subject = s3_subject_pattern in uri_to_check
                
                # Filter by S3 key pattern: must contain both university and subject patterns
                # Or skip filtering if disable_filtering is True or KENDRA_DISABLE_FILTERING env var is set (for testing)
                should_include = False
                if disable_filtering or KENDRA_DISABLE_FILTERING:
                    should_include = True
                else:
                    should_include = s3_university_pattern in uri_to_check and s3_subject_pattern in uri_to_check
                
                if should_include:
                    # Extract title - Kendra may return it as a dict with 'Text' key or as a string
                    document_title_raw = item.get("DocumentTitle", "Unknown")
                    if isinstance(document_title_raw, dict):
                        document_title = document_title_raw.get("Text", "Unknown")
                    else:
                        document_title = document_title_raw if document_title_raw else "Unknown"
                    
                    # Extract S3 key from URI for database lookup
                    # URI formats: https://bucket.s3.amazonaws.com/key or s3://bucket/key
                    s3_key = uri_to_check  # Already extracted above
                    
                    # Try to extract page number from Kendra response
                    # Kendra provides page numbers in DocumentAttributes with key '_excerpt_page_number'
                    page_number = None
                    document_excerpt = item.get("DocumentExcerpt", {})
                    
                    # Method 1: Check DocumentAttributes for page number (PRIMARY METHOD)
                    # Kendra stores page number as '_excerpt_page_number' in DocumentAttributes
                    document_attributes = item.get("DocumentAttributes", [])
                    if document_attributes:
                        for attr in document_attributes:
                            key = attr.get("Key", "")
                            # Kendra uses '_excerpt_page_number' key for page numbers
                            if key in ["_excerpt_page_number", "_page_number", "PageNumber", "page_number", "_document_page"]:
                                value_obj = attr.get("Value", {})
                                if isinstance(value_obj, dict):
                                    # Kendra returns page number as LongValue
                                    page_number = value_obj.get("LongValue") or value_obj.get("NumberValue") or value_obj.get("TextValue")
                                else:
                                    page_number = value_obj
                                if page_number is not None:
                                    break
                    
                    # Method 2: Check AdditionalAttributes for page number (fallback)
                    if page_number is None:
                        additional_attributes = item.get("AdditionalAttributes", [])
                        if additional_attributes:
                            for attr in additional_attributes:
                                key = attr.get("Key", "")
                                if key in ["_page_number", "PageNumber", "page_number", "_document_page", "_excerpt_page_number"]:
                                    value_obj = attr.get("Value", {})
                                    if isinstance(value_obj, dict):
                                        page_number = value_obj.get("NumberValue") or value_obj.get("TextValue") or value_obj.get("LongValue")
                                    else:
                                        page_number = value_obj
                                    if page_number is not None:
                                        break
                    
                    # Method 3: Check DocumentExcerpt metadata (fallback)
                    if page_number is None and isinstance(document_excerpt, dict):
                        excerpt_metadata = document_excerpt.get("Metadata", {})
                        if excerpt_metadata:
                            page_number = excerpt_metadata.get("PageNumber") or excerpt_metadata.get("page_number")
                    
                    result = {
                        "excerpt": document_excerpt.get("Text", "") if isinstance(document_excerpt, dict) else "",
                        "document_title": document_title,  # This is the UUID filename from Kendra
                        "document_uri": document_uri,
                        "s3_key": s3_key,  # Add S3 key for database lookup
                        "page_number": page_number,  # Add page number if available
                        "relevance_score": item.get("ScoreAttributes", {}).get("ScoreConfidence", "MEDIUM"),
                        "type": item.get("Type", "DOCUMENT")
                    }
                    
                    # Only include document results (not answers) with excerpts
                    if result["type"] == "DOCUMENT" and result["excerpt"]:
                        # Apply quality filtering to ensure result has substantial content
                        if _is_quality_result(result, question):
                            results.append(result)
                            
                            # Stop when we have enough filtered results
                            if len(results) >= max_results:
                                break
                        else:
                            filtered_out += 1
                    else:
                        filtered_out += 1
                else:
                    filtered_out += 1
        
        return results
    
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        error_message = e.response.get('Error', {}).get('Message', str(e))
        raise Exception(f"Kendra query failed ({error_code}): {error_message}")
    except BotoCoreError as e:
        raise Exception(f"Kendra client error: {str(e)}")
    except Exception as e:
        raise Exception(f"Unexpected error querying Kendra: {str(e)}")


def format_kendra_results_for_gemini(results: List[Dict]) -> str:
    """
    Format Kendra results into a context string for Gemini.
    
    Args:
        results: List of Kendra result dictionaries
    
    Returns:
        Formatted context string
    """
    if not results:
        return ""
    
    context_text = "Reference material from study documents:\n\n"
    
    for i, result in enumerate(results, 1):
        context_text += f"[Document {i}]\n"
        context_text += f"Title: {result.get('document_title', 'Unknown')}\n"
        
        excerpt = result.get('excerpt', '')
        if excerpt:
            context_text += f"Content: {excerpt}\n"
        
        context_text += "\n"
    
    return context_text

