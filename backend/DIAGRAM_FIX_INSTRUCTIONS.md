# Diagram Fix Instructions

## Issue
Diagrams are being generated but presigned URLs are returning 400 Bad Request errors, and diagrams are not being saved to the database.

## Root Cause
The presigned URLs are being generated with the wrong AWS region. The processed docs bucket (`study-tap-processed-docs`) is in `ap-south-1`, but the S3 client might be configured for a different region.

## Solution Steps

### 1. Run Database Migration
First, ensure the `diagrams` column exists in the `chat_messages` table:

```bash
cd backend
python migrations/add_diagrams_to_chat_messages.py
```

### 2. Update Environment Variables
Add the following to your `.env` file:

```env
# Processed docs bucket (if different from AWS_S3_BUCKET)
AWS_S3_PROCESSED_BUCKET=study-tap-processed-docs

# Processed docs region (must match the bucket's actual region)
AWS_S3_PROCESSED_REGION=ap-south-1
```

**Important**: The `AWS_S3_PROCESSED_REGION` must match the actual region where your `study-tap-processed-docs` bucket is located. Based on the error, it appears to be `ap-south-1`.

### 3. Verify IAM Permissions
Ensure your IAM user has the following permissions for the processed docs bucket:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::study-tap-processed-docs",
                "arn:aws:s3:::study-tap-processed-docs/*"
            ]
        }
    ]
}
```

### 4. Restart Backend Server
After updating the `.env` file, restart your backend server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
uvicorn app.main:app --reload
```

### 5. Test
1. Send a message that should trigger diagram generation
2. Check the backend logs for any errors
3. Verify diagrams appear in the response
4. Refresh the page and verify diagrams are still displayed (loaded from database)

## Troubleshooting

### If diagrams still don't work:

1. **Check backend logs** for error messages when generating presigned URLs
2. **Verify bucket region**: Check in AWS Console what region your `study-tap-processed-docs` bucket is in
3. **Test presigned URL manually**: Copy a generated URL and test it in a browser
4. **Check database**: Verify the `diagrams` column exists:
   ```sql
   DESCRIBE chat_messages;
   ```
   You should see a `diagrams` column of type `JSON`.

### Common Issues:

- **Region mismatch**: Make sure `AWS_S3_PROCESSED_REGION` matches the bucket's actual region
- **Missing migration**: Run the migration script to add the `diagrams` column
- **IAM permissions**: Ensure your IAM user can read from the processed docs bucket
- **Bucket name**: Verify `AWS_S3_PROCESSED_BUCKET` is set correctly

