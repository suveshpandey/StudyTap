# AWS Kendra Setup Guide

This guide provides step-by-step instructions for setting up AWS Kendra to enable RAG (Retrieval-Augmented Generation) based chat functionality in the University AI Assistant.

## Overview

AWS Kendra is an intelligent search service that uses machine learning to understand the context and meaning of documents. In this application, Kendra:
1. Indexes PDF documents uploaded to S3
2. Retrieves relevant document chunks based on student questions
3. Filters results by university and subject
4. Provides context to Gemini LLM for generating accurate answers

## Prerequisites

- AWS Account with appropriate permissions
- S3 bucket already set up (e.g., `study-tap`)
- PDF documents uploaded to S3 with the format: `universities/{university_id}/branches/{branch_id}/subjects/{subject_id}/materials/{uuid}.pdf`
- AWS credentials (Access Key ID and Secret Access Key) with Kendra permissions

## Step-by-Step Setup

### Step 1: Create an AWS Kendra Index

1. **Navigate to AWS Kendra Console**
   - Go to [AWS Console](https://console.aws.amazon.com/)
   - Search for "Kendra" in the services search bar
   - Click on "Amazon Kendra"

2. **Create a New Index**
   - Click the "Create index" button
   - Enter an index name (e.g., `university-ai-assistant-index`)
   - Select the **Developer Edition** (for testing) or **Enterprise Edition** (for production)
     - **Developer Edition**: Free for first 30 days, then $0.10/hour
     - **Enterprise Edition**: $0.10/hour + storage costs
   - Choose your AWS region (must match your S3 bucket region, e.g., `us-east-1`)
   - Click "Next"

3. **Configure IAM Role**
   - Kendra will create a new IAM role automatically, or you can select an existing one
   - The role needs permissions to:
     - Read from your S3 bucket
     - Access CloudWatch Logs
   - Click "Next"

4. **Review and Create**
   - Review your settings
   - Click "Create index"
   - **Note**: Index creation takes 5-15 minutes. You'll see the index status change from "Creating" to "Active"

5. **Copy the Index ID**
   - Once the index is created, click on it to view details
   - Copy the **Index ID** (looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
   - You'll need this for your `.env` file

### Step 2: Create an S3 Data Source

1. **Navigate to Data Sources**
   - In your Kendra index, click on "Data sources" in the left sidebar
   - Click "Add data source"

2. **Select S3 as Data Source Type**
   - Choose "Amazon S3" from the list
   - Click "Add connector"

3. **Configure S3 Data Source**
   - **Name**: Enter a name (e.g., `university-materials-s3`)
   - **S3 Bucket**: Select your bucket (e.g., `study-tap`)
   - **IAM Role**: Select or create an IAM role with S3 read permissions
     - If creating new role, Kendra will auto-generate the necessary permissions
   - **Inclusion Patterns** (Optional): You can specify patterns to include only certain files
     - Example: `universities/*/branches/*/subjects/*/materials/*.pdf`
   - **Exclusion Patterns** (Optional): Specify patterns to exclude certain files
   - Click "Add data source"

4. **Sync Schedule**
   - Choose how often to sync:
     - **One-time sync**: Sync immediately and stop
     - **Scheduled sync**: Sync on a schedule (e.g., daily, weekly)
   - For development, "One-time sync" is fine
   - Click "Sync now" to start the initial sync

5. **Wait for Sync to Complete**
   - The sync status will show "Syncing" → "Active"
   - This can take 10-30 minutes depending on the number of documents
   - You can monitor progress in the "Sync run history" tab

### Step 3: Configure IAM Permissions

**⚠️ IMPORTANT**: Your IAM user needs permission to **query** Kendra, not just read. This is a common issue!

Your IAM user/role needs the following permissions to use Kendra:

1. **Go to IAM Console**
   - Navigate to IAM → Users (or Roles)
   - Select your user (e.g., `study-tap-uploader`)

2. **Attach Kendra Policy**
   - Click "Add permissions" → "Attach policies directly"
   - Search for and attach: `AmazonKendraReadOnlyAccess`
     - This policy includes the `kendra:Query` action needed for querying
   - For full control, you can use: `AmazonKendraFullAccess` (not recommended for production)

3. **Alternative: Create Custom Policy (Least Privilege)**
   If you prefer a custom policy with only query permissions:
   
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Action": [
                   "kendra:Query"
               ],
               "Resource": "arn:aws:kendra:us-east-1:YOUR_ACCOUNT_ID:index/YOUR_INDEX_ID"
           }
       ]
   }
   ```
   
   Replace:
   - `YOUR_ACCOUNT_ID`: Your AWS account ID (e.g., `154764642428`)
   - `YOUR_INDEX_ID`: Your Kendra index ID (e.g., `6b7e4799-1f7e-4400-ae1b-461eba0edaed`)
   - `us-east-1`: Your AWS region

4. **Verify S3 Permissions**
   - Ensure your IAM user has S3 read permissions for your bucket
   - This should already be set if you configured S3 uploads

5. **Wait for Permissions to Propagate**
   - After adding permissions, wait 1-2 minutes for them to propagate
   - Then test again with `python test_kendra.py`

### Step 4: Configure Environment Variables

Add the following to your `backend/.env` file:

```env
# AWS Kendra Configuration
KENDRA_INDEX_ID=your-kendra-index-id-here
AWS_REGION=us-east-1  # Must match your Kendra index region
```

**Note**: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` should already be set from S3 configuration.

### Step 5: Verify Configuration

1. **Check Kendra Index Status**
   - Go to Kendra Console → Your Index
   - Ensure status is "Active"
   - Check "Data sources" tab - ensure sync is complete

2. **Test Kendra Query (Optional)**
   - In Kendra Console, go to "Search indexed content"
   - Enter a test query
   - Verify results are returned

3. **Test Backend Integration**
   - Start your backend server:
     ```bash
     cd backend
     uvicorn app.main:app --reload
     ```
   - Check console output for: `"Kendra client initialized successfully."`
   - If you see warnings, verify your `.env` file has all required variables

## How It Works

### Query Flow

1. **Student asks a question** in the chat interface
2. **Backend receives question** with `chat_id`, `subject_id`, and `university_id`
3. **Kendra Query**:
   - Queries Kendra index with the student's question
   - Retrieves top relevant document excerpts
   - Filters results by S3 URI pattern: `universities/{university_id}/.../subjects/{subject_id}/...`
4. **Context Formatting**:
   - Formats Kendra results into context text
   - Includes document titles and excerpts
5. **Gemini Generation**:
   - Sends question + context to Gemini API
   - Gemini generates a polished answer based on the context
6. **Response**:
   - Returns answer to student
   - Includes source citations

### S3 Key Structure

Documents must follow this structure for proper filtering:

```
universities/{university_id}/branches/{branch_id}/subjects/{subject_id}/materials/{uuid}.pdf
```

Example:
```
universities/1/branches/1/subjects/1/materials/172601fe-a506-49ed-a6e6-4803dffd50ef.pdf
```

## Troubleshooting

### "Kendra is not configured" Error

**Symptoms**: Error message when trying to use chat

**Solutions**:
1. Check `.env` file has `KENDRA_INDEX_ID` set
2. Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set
3. Restart the backend server after updating `.env`

### "Kendra query failed" Error

**Symptoms**: Error when querying Kendra

**Solutions**:
1. Verify Kendra index is "Active" (not "Creating" or "Failed")
2. Check IAM permissions - user needs `kendra:Query` permission
3. Verify index ID is correct in `.env`
4. Check AWS region matches between index and `.env`

### No Results Returned

**Symptoms**: Kendra query succeeds but returns no results

**Solutions**:
1. Check data source sync status - ensure sync completed successfully
2. Verify documents exist in S3 with correct path structure
3. Check S3 bucket permissions - Kendra needs read access
4. Verify S3 URI pattern matches: `universities/{university_id}/.../subjects/{subject_id}/...`
5. Try querying directly in Kendra Console to verify documents are indexed

### Slow Query Performance

**Symptoms**: Queries take a long time

**Solutions**:
1. Check Kendra index status - ensure it's fully synced
2. Reduce `max_results` parameter (default is 5)
3. Consider using Kendra's attribute filters (advanced)
4. Monitor CloudWatch metrics for index performance

### Documents Not Indexed

**Symptoms**: Documents in S3 but not appearing in Kendra results

**Solutions**:
1. Check data source sync status
2. Verify file format - Kendra supports PDF, Word, HTML, etc.
3. Check file size - very large files may take longer to index
4. Review sync run history for errors
5. Manually trigger a sync: Data sources → Your data source → "Sync now"

## Cost Considerations

### Kendra Pricing

**Developer Edition**:
- First 30 days: Free
- After 30 days: $0.10/hour (~$73/month if running 24/7)
- Storage: $0.10/GB/month
- Query: $0.10 per 1,000 queries

**Enterprise Edition**:
- $0.10/hour (~$73/month if running 24/7)
- Storage: $0.10/GB/month
- Query: $0.10 per 1,000 queries

### Cost Optimization Tips

1. **Use Developer Edition** for testing and small deployments
2. **Schedule syncs** instead of continuous syncing
3. **Monitor usage** with AWS Cost Explorer
4. **Set up billing alerts** in AWS Billing Console
5. **Delete unused indexes** when not needed

### Estimated Monthly Cost (Example)

For a small university with:
- 1 Kendra index (Developer Edition): $73/month
- 100 PDF documents (avg 5MB each = 500MB): $0.05/month
- 10,000 queries/month: $1/month

**Total**: ~$74/month

## Document Search

The application uses AWS Kendra exclusively for document search:

1. **Kendra Only**: The system uses Kendra for all document search operations
2. **Note**: The MaterialChunk database table has been removed - all document search is handled by Kendra

**Important**: Ensure Kendra is properly configured and available, as there is no database fallback.

## Advanced Configuration

### Custom Attribute Filters

For more precise filtering, you can modify `backend/app/kendra_client.py` to use Kendra's attribute filters. However, the current implementation filters results in Python, which is more reliable for S3 URI patterns.

### Query Enhancement

You can enhance queries by:
- Adding query suggestions
- Using query expansion
- Implementing query result ranking customization

Refer to [AWS Kendra Documentation](https://docs.aws.amazon.com/kendra/) for advanced features.

## Security Best Practices

1. **IAM Roles**: Use IAM roles instead of access keys when possible (e.g., on EC2)
2. **Least Privilege**: Grant only necessary Kendra permissions
3. **Encryption**: Enable encryption at rest for Kendra index
4. **VPC**: Consider using VPC endpoints for Kendra access
5. **Monitoring**: Enable CloudWatch logging for Kendra queries
6. **Access Control**: Use Kendra's access control lists (ACLs) if needed

## Support and Resources

- [AWS Kendra Documentation](https://docs.aws.amazon.com/kendra/)
- [AWS Kendra Pricing](https://aws.amazon.com/kendra/pricing/)
- [AWS Kendra FAQs](https://aws.amazon.com/kendra/faqs/)
- [AWS Support](https://aws.amazon.com/support/)

## Next Steps

After completing setup:

1. ✅ Verify Kendra index is active
2. ✅ Verify data source sync is complete
3. ✅ Add `KENDRA_INDEX_ID` to `.env`
4. ✅ Restart backend server
5. ✅ Test chat functionality with a student question
6. ✅ Monitor Kendra query performance
7. ✅ Set up CloudWatch alarms for errors

---

**Last Updated**: January 2025

