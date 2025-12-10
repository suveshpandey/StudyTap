# Quick Fix: Kendra Query Permission Error

## Error Message

```
AccessDeniedException: User: arn:aws:iam::154764642428:user/study-tap-uploader 
is not authorized to perform: kendra:Query on resource: 
arn:aws:kendra:us-east-1:154764642428:index/6b7e4799-1f7e-4400-ae1b-461eba0edaed 
because no identity-based policy allows the kendra:Query action
```

## Problem

Your IAM user `study-tap-uploader` has S3 permissions but **doesn't have permission to query Kendra**.

## Solution (Choose One)

### Option 1: Attach AWS Managed Policy (Easiest)

1. **Go to AWS IAM Console**
   - Navigate to: https://console.aws.amazon.com/iam/
   - Click "Users" in the left sidebar
   - Click on your user: `study-tap-uploader`

2. **Add Permissions**
   - Click the "Add permissions" button
   - Select "Attach policies directly"
   - In the search box, type: `AmazonKendraReadOnlyAccess`
   - Check the box next to `AmazonKendraReadOnlyAccess`
   - Click "Next" → "Add permissions"

3. **Wait 1-2 minutes** for permissions to propagate

4. **Test again**
   ```bash
   cd backend
   python test_kendra.py
   ```

### Option 2: Create Custom Policy (More Secure)

1. **Go to IAM Console → Policies**
   - Click "Create policy"
   - Click the "JSON" tab
   - Paste this policy (replace with your values):

   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Action": [
                   "kendra:Query"
               ],
               "Resource": "arn:aws:kendra:us-east-1:154764642428:index/6b7e4799-1f7e-4400-ae1b-461eba0edaed"
           }
       ]
   }
   ```

2. **Name the policy**: `KendraQueryAccess-study-tap`

3. **Create the policy**

4. **Attach to your user**:
   - Go to Users → `study-tap-uploader`
   - Click "Add permissions" → "Attach policies directly"
   - Search for `KendraQueryAccess-study-tap`
   - Attach it

5. **Wait 1-2 minutes** and test again

## Verify It Works

After adding permissions, run:

```bash
cd backend
python test_kendra.py
```

You should now see results instead of the AccessDeniedException error.

## Still Having Issues?

1. **Check Policy Attachment**:
   - Go to IAM → Users → `study-tap-uploader`
   - Click "Permissions" tab
   - Verify `AmazonKendraReadOnlyAccess` (or your custom policy) is listed

2. **Check Resource ARN**:
   - Make sure the index ID in your policy matches your actual index ID
   - Format: `arn:aws:kendra:REGION:ACCOUNT_ID:index/INDEX_ID`

3. **Wait Longer**:
   - AWS permissions can take up to 5 minutes to propagate
   - Try again after waiting

4. **Check Region**:
   - Ensure your Kendra index region matches the region in your policy ARN

---

**Quick Reference**:
- Your Account ID: `154764642428`
- Your Index ID: `6b7e4799-1f7e-4400-ae1b-461eba0edaed`
- Your Region: `us-east-1` (verify this matches your index)
- Your User: `study-tap-uploader`

