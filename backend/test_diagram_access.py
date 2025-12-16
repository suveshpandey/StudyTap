#!/usr/bin/env python3
"""
Test script to verify diagram metadata access
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.diagram_utils import (
    extract_pdf_uuid_from_s3_key,
    load_metadata_from_s3,
    get_diagrams_for_pages,
    generate_diagram_presigned_urls,
    PROCESSED_DOCS_BUCKET
)

def test_diagram_access():
    print("=" * 60)
    print("Testing Diagram Access")
    print("=" * 60)
    
    # Test data from user's response
    s3_key = "universities/1/branches/1/subjects/1/materials/d05b3845-c90d-43b8-815d-60d5eac29dcc.pdf"
    expected_page = 7
    
    print(f"\n1. Testing PDF UUID extraction from S3 key:")
    print(f"   S3 Key: {s3_key}")
    pdf_uuid = extract_pdf_uuid_from_s3_key(s3_key)
    print(f"   Extracted UUID: {pdf_uuid}")
    
    if not pdf_uuid:
        print("   [FAILED] Could not extract PDF UUID")
        return
    
    print(f"\n2. Testing metadata loading:")
    print(f"   Bucket: {PROCESSED_DOCS_BUCKET}")
    print(f"   Expected path: processed/materials/{pdf_uuid}/metadata.json")
    metadata = load_metadata_from_s3(pdf_uuid)
    
    if not metadata:
        print("   [FAILED] Could not load metadata")
        print("   This could mean:")
        print("   - Metadata file doesn't exist")
        print("   - Wrong bucket name")
        print("   - S3 permissions issue (MOST LIKELY)")
        print("\n   SOLUTION: Add s3:GetObject permission for the processed docs bucket")
        print(f"   to your IAM user. The bucket is: {PROCESSED_DOCS_BUCKET}")
        return
    
    print(f"   [SUCCESS] Metadata loaded successfully")
    print(f"   PDF UUID in metadata: {metadata.get('pdf_uuid')}")
    
    pages = metadata.get("pages", {})
    print(f"   Available pages in metadata: {list(pages.keys())}")
    
    print(f"\n3. Testing page {expected_page} access:")
    page_str = str(expected_page)
    if page_str not in pages:
        print(f"   [FAILED] Page {expected_page} not found in metadata")
        print(f"   Available pages: {list(pages.keys())}")
        return
    
    page_data = pages[page_str]
    images = page_data.get("images", [])
    print(f"   [SUCCESS] Page {expected_page} found")
    print(f"   Images for page {expected_page}: {images}")
    
    if not images:
        print(f"   [WARNING] No images found for page {expected_page}")
        return
    
    print(f"\n4. Testing diagram retrieval:")
    page_pairs = [(pdf_uuid, expected_page)]
    diagrams_dict = get_diagrams_for_pages(page_pairs)
    print(f"   Diagrams dict: {diagrams_dict}")
    
    if not diagrams_dict:
        print("   [FAILED] No diagrams retrieved")
        return
    
    print(f"\n5. Testing presigned URL generation:")
    diagrams = generate_diagram_presigned_urls(diagrams_dict)
    print(f"   Generated {len(diagrams)} presigned URLs")
    
    for i, diagram in enumerate(diagrams, 1):
        print(f"   Diagram {i}:")
        print(f"     - PDF UUID: {diagram['pdf_uuid']}")
        print(f"     - Page: {diagram['page']}")
        print(f"     - URL: {diagram['url'][:80]}...")
    
    if diagrams:
        print(f"\n[SUCCESS] All tests passed!")
        print(f"   Found {len(diagrams)} diagram(s) for page {expected_page}")
    else:
        print(f"\n[FAILED] No presigned URLs generated")

if __name__ == "__main__":
    test_diagram_access()

