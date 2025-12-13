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
from typing import List, Dict, Optional

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


def _is_quality_result(result: Dict, question: str, min_excerpt_length: int = 30) -> bool:
    """
    Check if a Kendra result is of sufficient quality to be included.
    Filters out results that only contain question keywords without substantial content.
    
    Args:
        result: Kendra result dictionary
        question: Original question asked
        min_excerpt_length: Minimum excerpt length in characters (default: 30, reduced from 50)
    
    Returns:
        True if result is of sufficient quality, False otherwise
    """
    excerpt = result.get("excerpt", "").strip()
    
    # Check 1: Excerpt must have minimum length (reduced to 30 to be less strict)
    if len(excerpt) < min_excerpt_length:
        return False
    
    # Check 2: Relevance score - only exclude LOW if it's explicitly LOW
    # Allow MEDIUM and HIGH, and also allow if score is missing (default to MEDIUM)
    relevance_score = result.get("relevance_score", "MEDIUM")
    # Don't filter out LOW scores - Kendra might still return useful content
    
    # Check 3: Excerpt should have some meaningful content
    # Reduced word count requirement from 10 to 5 words
    word_count = len(excerpt.split())
    if word_count < 5:  # Less than 5 words is likely not substantial
        return False
    
    # Check 4: Excerpt should not be mostly whitespace or special characters
    alphanumeric_chars = sum(1 for c in excerpt if c.isalnum())
    if alphanumeric_chars < len(excerpt) * 0.3:  # Reduced from 0.5 to 0.3 (30% alphanumeric minimum)
        return False
    
    # Removed overly strict keyword matching checks - Kendra's relevance scoring is sufficient
    
    return True


def query_kendra(
    question: str,
    university_id: int,
    subject_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    max_results: int = 5,
    disable_filtering: bool = False
) -> List[Dict]:
    """
    Query AWS Kendra index with a question and filter by university and subject/branch.
    
    Uses S3 key filtering to ensure only relevant documents are retrieved.
    S3 Key Format: universities/{university_id}/branches/{branch_id}/subjects/{subject_id}/materials/{uuid}.pdf
    
    Args:
        question: The student's question
        university_id: University ID for filtering
        subject_id: Subject ID for filtering (optional, for subject-specific queries)
        branch_id: Branch ID for filtering (optional, for branch-level queries when subject_id is None)
        max_results: Maximum number of results to return (default: 5)
    
    Returns:
        List of dictionaries containing:
        - excerpt: The relevant text excerpt
        - document_title: Title of the source document
        - document_uri: S3 URI of the document
        - relevance_score: Relevance score from Kendra
    
    Raises:
        ValueError: If Kendra is not configured or both subject_id and branch_id are None
        Exception: If there's an error querying Kendra
    """
    if not KENDRA_ENABLED or not kendra_client:
        raise ValueError("Kendra is not configured. Please check your environment variables.")
    
    if subject_id is None and branch_id is None:
        raise ValueError("Either subject_id or branch_id must be provided")
    
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
        s3_branch_pattern = f"branches/{branch_id}/" if branch_id else None
        s3_subject_pattern = f"subjects/{subject_id}/" if subject_id else None
        
        results = []
        total_items = 0
        filtered_out = 0
        
        if "ResultItems" in response:
            total_items = len(response["ResultItems"])
            print(f"[Kendra Debug] Total items from Kendra: {total_items}")
            
            for item in response["ResultItems"]:
                document_uri = item.get("DocumentURI", "")
                item_type = item.get("Type", "DOCUMENT")
                print(f"[Kendra Debug] Processing item: type={item_type}, URI={document_uri[:100] if document_uri else 'None'}...")
                
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
                has_branch = s3_branch_pattern in uri_to_check if s3_branch_pattern else True
                has_subject = s3_subject_pattern in uri_to_check if s3_subject_pattern else True
                
                print(f"[Kendra Debug] URI to check: {uri_to_check[:100]}...")
                print(f"[Kendra Debug] Looking for: {s3_university_pattern} and {'subject: ' + s3_subject_pattern if s3_subject_pattern else 'branch: ' + s3_branch_pattern if s3_branch_pattern else 'none'}")
                print(f"[Kendra Debug] University match: {has_university}, Branch match: {has_branch}, Subject match: {has_subject}")
                
                # Filter by S3 key pattern:
                # - Subject-level: must contain university and subject patterns
                # - Branch-level: must contain university and branch patterns
                # Or skip filtering if disable_filtering is True or KENDRA_DISABLE_FILTERING env var is set (for testing)
                should_include = False
                if disable_filtering or KENDRA_DISABLE_FILTERING:
                    print(f"[Kendra Debug] Filtering disabled - including all results")
                    should_include = True
                else:
                    if subject_id is not None:
                        # Subject-level filtering
                        should_include = has_university and has_subject
                    elif branch_id is not None:
                        # Branch-level filtering
                        should_include = has_university and has_branch
                    else:
                        should_include = False
                
                print(f"[Kendra Debug] Should include: {should_include}")
                
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
                    
                    # Extract excerpt text - handle both DOCUMENT and ANSWER types
                    excerpt_text = ""
                    item_type = item.get("Type", "DOCUMENT")
                    
                    if item_type == "DOCUMENT":
                        # For DOCUMENT type, get text from DocumentExcerpt
                        excerpt_text = document_excerpt.get("Text", "") if isinstance(document_excerpt, dict) else ""
                    elif item_type == "ANSWER":
                        # For ANSWER type, get text from AdditionalAttributes -> AnswerText
                        additional_attributes = item.get("AdditionalAttributes", [])
                        for attr in additional_attributes:
                            if attr.get("Key") == "AnswerText":
                                value_obj = attr.get("Value", {})
                                if isinstance(value_obj, dict):
                                    text_with_highlights = value_obj.get("TextWithHighlightsValue", {})
                                    if isinstance(text_with_highlights, dict):
                                        excerpt_text = text_with_highlights.get("Text", "")
                                    else:
                                        excerpt_text = str(text_with_highlights)
                                else:
                                    excerpt_text = str(value_obj)
                                break
                        # If no AnswerText found, try DocumentExcerpt as fallback
                        if not excerpt_text:
                            excerpt_text = document_excerpt.get("Text", "") if isinstance(document_excerpt, dict) else ""
                    
                    result = {
                        "excerpt": excerpt_text,
                        "document_title": document_title,  # This is the UUID filename from Kendra
                        "document_uri": document_uri,
                        "s3_key": s3_key,  # Add S3 key for database lookup
                        "page_number": page_number,  # Add page number if available
                        "relevance_score": item.get("ScoreAttributes", {}).get("ScoreConfidence", "MEDIUM"),
                        "type": item_type
                    }
                    
                    # Include both DOCUMENT and ANSWER type results with excerpts
                    if result["excerpt"] and len(result["excerpt"].strip()) > 0:
                        print(f"[Kendra Debug] Excerpt found: length={len(result['excerpt'])}, type={item_type}")
                        # Apply quality filtering to ensure result has substantial content
                        # For ANSWER types, be more lenient with quality checks
                        is_quality = item_type == "ANSWER" or _is_quality_result(result, question)
                        print(f"[Kendra Debug] Quality check passed: {is_quality}")
                        if is_quality:
                            print(f"[Kendra Debug] Added result: {result.get('document_title', 'Unknown')[:50]}...")
                            results.append(result)
                            
                            # Stop when we have enough filtered results
                            if len(results) >= max_results:
                                break
                        else:
                            print(f"[Kendra Debug] Filtered out (quality check failed)")
                            filtered_out += 1
                    else:
                        print(f"[Kendra Debug] Filtered out (no excerpt or empty)")
                        filtered_out += 1
                else:
                    print(f"[Kendra Debug] Filtered out (pattern mismatch)")
                    filtered_out += 1
        
        print(f"[Kendra Debug] Total items: {total_items}, Results: {len(results)}, Filtered out: {filtered_out}")
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

