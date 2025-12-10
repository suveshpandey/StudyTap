# Kendra Integration Troubleshooting Guide

## Problem: Getting "I don't have enough information" Response

If you're getting the response "I don't have enough information in the provided notes to fully answer this" even though:
- ✅ Kendra is set up and working
- ✅ You can see results in Kendra Console
- ✅ Documents are indexed in Kendra

This usually means **Kendra is returning results, but they're being filtered out** before reaching Gemini.

## Common Causes

### 1. S3 URI Format Mismatch

**Problem**: The S3 URI format from Kendra doesn't match the filtering pattern.

**Kendra returns URIs in format**: `s3://bucket-name/universities/1/branches/1/subjects/1/materials/uuid.pdf`

**Our filter looks for**: `universities/{university_id}/.../subjects/{subject_id}/...`

**Solution**: The code now handles both formats, but verify your S3 keys match the expected pattern.

### 2. University/Subject ID Mismatch

**Problem**: The `university_id` or `subject_id` in your database doesn't match the IDs in your S3 keys.

**Example**:
- Your S3 key: `universities/1/branches/1/subjects/5/materials/...`
- Your chat subject_id: `3` (doesn't match!)

**Solution**: Verify the IDs match:
```sql
-- Check your subject's ID
SELECT id, name FROM subjects WHERE id = <your_subject_id>;

-- Check the university_id
SELECT id, name FROM universities WHERE id = <your_university_id>;
```

### 3. Kendra Not Returning Results

**Problem**: Kendra query succeeds but returns 0 results.

**Solution**: 
- Check Kendra Console - can you see results there?
- Verify documents are synced (Data sources → Sync status)
- Try querying directly in Kendra Console with the same question

## Diagnostic Steps

### Step 1: Run the Diagnostic Script

```bash
cd backend
python test_kendra.py
```

This will:
1. Test Kendra connection
2. Query with and without filtering
3. Show you exactly what URIs are being returned
4. Help identify the issue

### Step 2: Check Backend Logs

When you send a chat message, check your backend console for debug output:

```
[Chat Debug] Querying Kendra with question: 'your question'
[Chat Debug] University ID: 1, Subject ID: 1
[Kendra Debug] Document URI: s3://study-tap/universities/1/...
[Kendra Debug] Results: 0
```

Look for:
- Are results being returned from Kendra?
- Are they being filtered out?
- What do the URIs look like?

### Step 3: Temporarily Disable Filtering

To test if filtering is the issue, add this to your `.env`:

```env
KENDRA_DISABLE_FILTERING=true
```

Then restart your backend and try the chat again. If it works now, the issue is with the filtering logic.

**⚠️ Warning**: This will return results from ALL universities/subjects. Only use for testing!

### Step 4: Verify S3 Key Structure

Check your actual S3 keys. They should follow this pattern:

```
universities/{university_id}/branches/{branch_id}/subjects/{subject_id}/materials/{uuid}.pdf
```

Example:
```
universities/1/branches/1/subjects/1/materials/172601fe-a506-49ed-a6e6-4803dffd50ef.pdf
```

### Step 5: Check Kendra Console

1. Go to AWS Kendra Console
2. Select your index
3. Click "Search indexed content"
4. Enter your test question
5. Check if results appear
6. Click on a result and check the "Document URI" field
7. Verify it matches the expected pattern

## Solutions

### Solution 1: Fix S3 Key Structure

If your S3 keys don't match the expected pattern, you have two options:

**Option A**: Re-upload documents with correct structure (recommended)

**Option B**: Modify the filtering logic in `backend/app/kendra_client.py` to match your actual S3 key format.

### Solution 2: Update Database IDs

If your database IDs don't match your S3 keys:

1. Check what IDs are in your S3 keys
2. Update your database records to match, OR
3. Update the S3 keys to match your database

### Solution 3: Adjust Filtering Logic

If your S3 keys have a different structure, modify `query_kendra()` in `backend/app/kendra_client.py`:

```python
# Current filter
s3_university_pattern = f"universities/{university_id}/"
s3_subject_pattern = f"subjects/{subject_id}/"

# Modify to match your actual structure
# Example: if your keys are like "uni-{id}/sub-{id}/..."
s3_university_pattern = f"uni-{university_id}/"
s3_subject_pattern = f"sub-{subject_id}/"
```

## Quick Fix: Disable Filtering Temporarily

If you need a quick fix while you resolve the ID/structure issue:

1. Add to `.env`:
   ```env
   KENDRA_DISABLE_FILTERING=true
   ```

2. Restart backend

3. Test chat - it should now work, but will return results from all universities/subjects

4. **Important**: Re-enable filtering once you fix the structure/IDs:
   ```env
   KENDRA_DISABLE_FILTERING=false
   ```

## Expected Behavior

When working correctly:

1. Student asks question → Backend queries Kendra
2. Kendra returns results → Filtered by university/subject
3. Results formatted → Sent to Gemini
4. Gemini generates answer → Based on context
5. Answer returned to student

## Debug Output

The code now includes detailed debug logging. When you send a chat message, you'll see:

```
[Chat Debug] Querying Kendra with question: 'your question'
[Chat Debug] University ID: 1, Subject ID: 1
[Kendra Debug] Document URI: s3://study-tap/universities/1/branches/1/subjects/1/materials/...
[Kendra Debug] URI to check: universities/1/branches/1/subjects/1/materials/...
[Kendra Debug] Looking for: universities/1/ and subjects/1/
[Kendra Debug] Added result: Document Title
[Kendra Debug] Total items: 10, Results: 3, Filtered out: 7
[Chat Debug] Kendra returned 3 results
[Chat Debug] Context text length: 1234 characters
```

Use this output to identify where the issue is.

## Still Having Issues?

1. Run `python test_kendra.py` and share the output
2. Check backend console logs when sending a chat message
3. Verify S3 key structure matches expected pattern
4. Verify database IDs match S3 key IDs
5. Check Kendra Console to see if results appear there

---

**Last Updated**: January 2025

