# -----------------------------------------------------------------------------
# File: diagram_utils.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Utilities for loading and processing diagram metadata from S3
# -----------------------------------------------------------------------------

import json
import os
import boto3
from typing import List, Dict, Set, Tuple, Optional
from botocore.exceptions import ClientError
from app.s3_config import s3_client, S3_ENABLED, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
from dotenv import load_dotenv

load_dotenv()

# Processed docs bucket (defaults to same bucket if not set)
# If using a separate bucket, set AWS_S3_PROCESSED_BUCKET in .env
# Otherwise, it will use the same bucket as AWS_S3_BUCKET
_processed_bucket = os.getenv("AWS_S3_PROCESSED_BUCKET", "").strip()
# Clean the bucket name - ensure it's just the bucket name without any log contamination
if _processed_bucket:
    # Split by whitespace and take first part only (in case of any contamination)
    PROCESSED_DOCS_BUCKET = _processed_bucket.split()[0].strip()
else:
    PROCESSED_DOCS_BUCKET = AWS_S3_BUCKET

# Processed docs region (defaults to same region if not set)
# If processed docs bucket is in a different region, set AWS_S3_PROCESSED_REGION in .env
PROCESSED_DOCS_REGION = os.getenv("AWS_S3_PROCESSED_REGION", AWS_REGION).strip()

# Create a separate S3 client for processed docs if needed (in case of different region)
if S3_ENABLED and AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
    # Use the same client if same region, otherwise create a new one
    if PROCESSED_DOCS_REGION == AWS_REGION:
        processed_docs_s3_client = s3_client
    else:
        processed_docs_s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=PROCESSED_DOCS_REGION
        )
else:
    processed_docs_s3_client = None



def extract_pdf_uuid_from_s3_key(s3_key: str) -> Optional[str]:
    """
    Extract PDF UUID from S3 key.
    
    S3 key format: universities/{university_id}/branches/{branch_id}/subjects/{subject_id}/materials/{pdf_uuid}.pdf
    
    Args:
        s3_key: S3 key string
        
    Returns:
        PDF UUID string (without .pdf extension), or None if not found
    """
    if not s3_key:
        return None
    
    # Extract the filename from the path
    parts = s3_key.split("/")
    if not parts:
        return None
    
    filename = parts[-1]  # Get the last part (filename)
    
    # Remove .pdf extension if present
    if filename.endswith(".pdf"):
        pdf_uuid = filename[:-4]  # Remove .pdf
        return pdf_uuid
    
    return None


def load_metadata_from_s3(pdf_uuid: str) -> Optional[Dict]:
    """
    Load metadata.json from S3 for a given PDF UUID.
    
    Metadata location: study-tap-processed-docs/processed/materials/{pdf_uuid}/metadata.json
    
    Args:
        pdf_uuid: PDF UUID (without .pdf extension)
        
    Returns:
        Metadata dictionary, or None if not found or error
    """
    if not S3_ENABLED or not processed_docs_s3_client:
        return None
    
    if not pdf_uuid:
        return None
    
    metadata_key = f"processed/materials/{pdf_uuid}/metadata.json"
    # Ensure bucket name is clean (strip any whitespace or newlines that might have been corrupted)
    bucket_name = str(PROCESSED_DOCS_BUCKET).strip().split()[0]  # Take first word only
    
    try:
        response = processed_docs_s3_client.get_object(
            Bucket=bucket_name,
            Key=metadata_key
        )
        
        # Read and parse JSON
        metadata_content = response['Body'].read().decode('utf-8')
        metadata = json.loads(metadata_content)
        
        return metadata
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', '')
        if error_code == 'NoSuchKey':
            # Metadata file doesn't exist - this is okay, just return None
            return None
        return None
    except (json.JSONDecodeError, Exception):
        return None


def get_diagrams_for_pages(
    page_pairs: List[Tuple[str, int]]
) -> Dict[str, Dict[int, List[str]]]:
    """
    Get diagram S3 keys for specific (pdf_uuid, page_number) pairs.
    
    Args:
        page_pairs: List of (pdf_uuid, page_number) tuples
        
    Returns:
        Dictionary structure:
        {
            pdf_uuid: {
                page_number: [s3_key1, s3_key2, ...]
            }
        }
    """
    result: Dict[str, Dict[int, List[str]]] = {}
    
    if not page_pairs:
        print(f"[Diagram Utils] No page pairs provided")
        return result
    
    print(f"[Diagram Utils] Processing {len(page_pairs)} page pairs: {page_pairs}")
    
    # Group by pdf_uuid to minimize S3 calls
    pdf_uuid_to_pages: Dict[str, Set[int]] = {}
    for pdf_uuid, page_number in page_pairs:
        if pdf_uuid not in pdf_uuid_to_pages:
            pdf_uuid_to_pages[pdf_uuid] = set()
        pdf_uuid_to_pages[pdf_uuid].add(page_number)
    
    print(f"[Diagram Utils] Grouped into {len(pdf_uuid_to_pages)} unique PDFs")
    
    # Load metadata for each unique pdf_uuid
    for pdf_uuid, pages in pdf_uuid_to_pages.items():
        print(f"[Diagram Utils] Loading metadata for PDF: {pdf_uuid}, pages: {sorted(pages)}")
        metadata = load_metadata_from_s3(pdf_uuid)
        
        if not metadata:
            print(f"[Diagram Utils] No metadata found for {pdf_uuid}")
            continue
        
        print(f"[Diagram Utils] Metadata loaded for {pdf_uuid}")
        
        # Initialize result structure for this pdf_uuid
        if pdf_uuid not in result:
            result[pdf_uuid] = {}
        
        # Extract pages from metadata
        metadata_pages = metadata.get("pages", {})
        print(f"[Diagram Utils] Available pages in metadata: {list(metadata_pages.keys())}")
        
        # For each requested page, get diagrams
        for page_number in pages:
            page_str = str(page_number)
            
            if page_str not in metadata_pages:
                print(f"[Diagram Utils] Page {page_str} not found in metadata")
                continue
            
            page_data = metadata_pages[page_str]
            images = page_data.get("images", [])
            
            if not images:
                print(f"[Diagram Utils] No images found for page {page_str}")
                continue
            
            print(f"[Diagram Utils] Found {len(images)} images for page {page_str}: {images}")
            
            # Convert relative paths to full S3 keys
            diagram_keys = []
            for image_path in images:
                # Image paths in metadata are relative: processed/materials/{pdf_uuid}/page-{page}/embedded-{n}.png
                # We need to ensure they're full S3 keys
                if not image_path.startswith("processed/"):
                    # If it's already a full path, use it
                    diagram_keys.append(image_path)
                else:
                    # It's a relative path, use as-is (it's already correct)
                    diagram_keys.append(image_path)
            
            if diagram_keys:
                result[pdf_uuid][page_number] = diagram_keys
                print(f"[Diagram Utils] Added {len(diagram_keys)} diagram keys for {pdf_uuid} page {page_number}")
    
    print(f"[Diagram Utils] Final result: {len(result)} PDFs with diagrams")
    return result


def generate_diagram_presigned_urls(
    diagrams: Dict[str, Dict[int, List[str]]],
    expiration: int = 604800  # 7 days in seconds
) -> List[Dict[str, any]]:
    """
    Convert diagram S3 keys to presigned URLs.
    
    Args:
        diagrams: Dictionary from get_diagrams_for_pages
        expiration: URL expiration time in seconds (default: 1 hour)
        
    Returns:
        List of dictionaries:
        [
            {
                "pdf_uuid": "...",
                "page": 21,
                "url": "https://presigned-url"
            },
            ...
        ]
    """
    result = []
    
    if not S3_ENABLED or not processed_docs_s3_client:
        print(f"[Diagram Utils] S3 not enabled or client not available. S3_ENABLED: {S3_ENABLED}, client: {bool(processed_docs_s3_client)}")
        return result
    
    print(f"[Diagram Utils] Generating presigned URLs for {len(diagrams)} PDFs")
    for pdf_uuid, pages_dict in diagrams.items():
        for page_number, diagram_keys in pages_dict.items():
            print(f"[Diagram Utils] Processing {len(diagram_keys)} diagrams for {pdf_uuid} page {page_number}")
            for diagram_key in diagram_keys:
                try:
                    # Ensure bucket name is clean
                    bucket_name = str(PROCESSED_DOCS_BUCKET).strip().split()[0]  # Take first word only
                    print(f"[Diagram Utils] Generating presigned URL for bucket: {bucket_name}, key: {diagram_key}, region: {PROCESSED_DOCS_REGION}")
                    # Generate presigned URL using the processed docs S3 client (with correct region)
                    url = processed_docs_s3_client.generate_presigned_url(
                        'get_object',
                        Params={
                            'Bucket': bucket_name,
                            'Key': diagram_key
                        },
                        ExpiresIn=expiration
                    )
                    
                    if url:
                        result.append({
                            "pdf_uuid": pdf_uuid,
                            "page": page_number,
                            "url": url
                        })
                        print(f"[Diagram Utils] Successfully generated presigned URL for {diagram_key}")
                except ClientError as e:
                    # Log error for debugging
                    error_code = e.response.get('Error', {}).get('Code', 'Unknown')
                    error_msg = e.response.get('Error', {}).get('Message', str(e))
                    print(f"Error generating presigned URL for {diagram_key} in bucket {bucket_name}: {error_code} - {error_msg}")
                    continue
                except Exception as e:
                    # Log error for debugging
                    print(f"Unexpected error generating presigned URL for {diagram_key}: {e}")
                    continue
    
    return result

