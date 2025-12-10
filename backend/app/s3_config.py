# -----------------------------------------------------------------------------
# File: s3_config.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: AWS S3 configuration and upload utilities for material documents
# -----------------------------------------------------------------------------

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import os
from dotenv import load_dotenv
import uuid
from typing import Optional

load_dotenv()

# AWS S3 Configuration from environment variables
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET", "")

# Check if S3 is configured
S3_ENABLED = bool(AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_S3_BUCKET)

# Create S3 client if credentials are available
if S3_ENABLED:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
else:
    s3_client = None
    print("Warning: AWS S3 configuration not found. S3 upload functionality will be disabled.")
    print("Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET in your .env file.")


def generate_s3_key(university_id: int, branch_id: int, subject_id: int, file_extension: str) -> str:
    """
    Generate a unique S3 key for a material document.
    Format: universities/{university_id}/branches/{branch_id}/subjects/{subject_id}/materials/{uuid}.{ext}
    
    Args:
        university_id: University ID
        branch_id: Branch ID
        subject_id: Subject ID
        file_extension: File extension (e.g., 'pdf')
    
    Returns:
        S3 key string
    """
    unique_id = str(uuid.uuid4())
    return f"universities/{university_id}/branches/{branch_id}/subjects/{subject_id}/materials/{unique_id}.{file_extension}"


def upload_file_to_s3(file_content: bytes, s3_key: str, content_type: str = "application/pdf") -> bool:
    """
    Upload a file to AWS S3.
    
    Args:
        file_content: File content as bytes
        s3_key: S3 key (path) where the file will be stored
        content_type: MIME type of the file
    
    Returns:
        True if upload was successful, False otherwise
    
    Raises:
        ValueError: If S3 is not configured
        ClientError: If there's an error with the S3 operation
    """
    if not S3_ENABLED or not s3_client:
        raise ValueError("S3 is not configured. Please check your environment variables.")
    
    try:
        s3_client.put_object(
            Bucket=AWS_S3_BUCKET,
            Key=s3_key,
            Body=file_content,
            ContentType=content_type,
            # Optional: Add metadata
            Metadata={
                'uploaded-by': 'university-admin'
            }
        )
        return True
    except NoCredentialsError:
        raise ValueError("AWS credentials not available")
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        raise ClientError(
            {'Error': {'Code': error_code, 'Message': error_message}},
            'PutObject'
        )


def delete_file_from_s3(s3_key: str) -> bool:
    """
    Delete a file from AWS S3.
    
    Args:
        s3_key: S3 key (path) of the file to delete
    
    Returns:
        True if deletion was successful, False otherwise
    """
    if not S3_ENABLED or not s3_client:
        raise ValueError("S3 is not configured. Please check your environment variables.")
    
    try:
        s3_client.delete_object(
            Bucket=AWS_S3_BUCKET,
            Key=s3_key
        )
        return True
    except ClientError as e:
        print(f"Error deleting file from S3: {e}")
        return False


def get_file_url(s3_key: str, expiration: int = 3600) -> Optional[str]:
    """
    Generate a presigned URL for accessing a file in S3.
    
    Args:
        s3_key: S3 key (path) of the file
        expiration: URL expiration time in seconds (default: 1 hour)
    
    Returns:
        Presigned URL string, or None if error
    """
    if not S3_ENABLED or not s3_client:
        return None
    
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': AWS_S3_BUCKET,
                'Key': s3_key
            },
            ExpiresIn=expiration
        )
        return url
    except ClientError as e:
        print(f"Error generating presigned URL: {e}")
        return None

