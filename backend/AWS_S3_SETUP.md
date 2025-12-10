# AWS S3 Configuration Setup

This document explains how to configure AWS S3 for uploading PDF material documents.

## Prerequisites

- AWS Account
- S3 Bucket created
- IAM User with S3 access

## AWS Setup

### 1. Create an S3 Bucket

1. Go to AWS Console → S3
2. Click "Create bucket"
3. Choose a unique bucket name (e.g., `university-ai-materials`)
4. Select your preferred region (e.g., `us-east-1`)
5. Configure bucket settings:
   - **Block Public Access**: Keep all public access blocked (recommended for security)
   - **Versioning**: Optional (recommended for backup)
   - **Encryption**: Enable server-side encryption (recommended)
6. Create the bucket

### 2. Create IAM User for S3 Access

1. Go to AWS Console → IAM → Users
2. Click "Add users"
3. Enter username (e.g., `university-ai-s3-uploader`)
4. Select "Access key - Programmatic access"
5. Click "Next: Permissions"

### 3. Attach S3 Permissions

**Option 1: Attach Existing Policy (Simple)**
- Attach the `AmazonS3FullAccess` policy (provides full S3 access)

**Option 2: Create Custom Policy (Recommended - Least Privilege)**
Create a custom policy with only the required permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-name",
                "arn:aws:s3:::your-bucket-name/*"
            ]
        }
    ]
}
```

Replace `your-bucket-name` with your actual S3 bucket name.

### 4. Get Access Keys

1. After creating the user, you'll see the **Access Key ID** and **Secret Access Key**
2. **Important**: Save these credentials securely - you won't be able to see the secret key again
3. Download the CSV file with credentials (recommended)

## Environment Configuration

Add the following variables to your `.env` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=university-ai-materials
```

Replace the values with your actual credentials:
- `AWS_ACCESS_KEY_ID`: Your IAM user access key ID
- `AWS_SECRET_ACCESS_KEY`: Your IAM user secret access key
- `AWS_REGION`: Your S3 bucket region (e.g., `us-east-1`, `eu-west-1`)
- `AWS_S3_BUCKET`: Your S3 bucket name

## S3 Key Structure

Uploaded PDF documents are stored with the following key structure:

```
universities/{university_id}/branches/{branch_id}/subjects/{subject_id}/materials/{uuid}.pdf
```

Example:
```
universities/1/branches/3/subjects/15/materials/a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf
```

This structure provides:
- **Organization**: Materials are organized by university, branch, and subject
- **Isolation**: Each university's materials are in separate paths
- **Uniqueness**: UUID ensures no filename conflicts
- **Traceability**: Easy to identify which materials belong to which subject

## Security Best Practices

1. **Never commit credentials**: Keep `.env` in `.gitignore`
2. **Use IAM roles**: For EC2/ECS deployments, use IAM roles instead of access keys
3. **Rotate keys regularly**: Change access keys periodically
4. **Minimal permissions**: Use the custom policy with least privilege
5. **Enable MFA**: Enable multi-factor authentication for the IAM user
6. **Monitor usage**: Set up CloudWatch alerts for unusual S3 activity
7. **Enable bucket versioning**: Protect against accidental deletions
8. **Enable server-side encryption**: Encrypt data at rest

## Testing

After configuration:

1. Start the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```

2. The S3 configuration is automatically validated on startup
3. Check the console for any S3 configuration warnings
4. Test by uploading a PDF through the university admin panel

## Troubleshooting

### "S3 upload is not configured" error
- Check that all S3 environment variables are set in `.env`
- Verify there are no typos in variable names
- Restart the backend server after updating `.env`

### "AWS credentials not available" error
- Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correct
- Check for extra spaces or quotes in the `.env` file
- Ensure the IAM user has not been deleted

### "Access Denied" error
- Verify the IAM user has the correct S3 permissions
- Check the bucket name matches `AWS_S3_BUCKET`
- Ensure the bucket exists and is in the correct region

### "NoSuchBucket" error
- Verify the bucket name is correct (case-sensitive)
- Check that the bucket exists in the specified region
- Ensure there are no typos in `AWS_S3_BUCKET`

## Cost Considerations

AWS S3 pricing includes:
- **Storage**: ~$0.023 per GB/month (standard storage)
- **PUT requests**: ~$0.005 per 1,000 requests
- **GET requests**: ~$0.0004 per 1,000 requests
- **Data transfer**: Free for uploads, varies for downloads

For a typical university with 1000 students and 500 PDF documents (averaging 5MB each):
- Storage cost: ~2.5 GB = ~$0.06/month
- Upload cost: 500 uploads = ~$0.0025
- **Total**: Less than $1/month

## Free Tier

AWS Free Tier includes (for the first 12 months):
- 5 GB of standard storage
- 20,000 GET requests
- 2,000 PUT requests
- 15 GB of data transfer out

This should be sufficient for most small to medium universities.

