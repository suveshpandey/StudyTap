# Fix Kendra Query Permission Error

## Problem
You're getting this error:
```
AccessDeniedException: User: arn:aws:iam::975050162024:user/study-tap-uploader is not authorized to perform: kendra:Query
```

## Quick Fix

### Option 1: Add AmazonKendraReadOnlyAccess Policy (Recommended)

1. Go to AWS IAM Console: https://console.aws.amazon.com/iam/
2. Click **Users** in the left sidebar
3. Find and click on **study-tap-uploader**
4. Click **Add permissions** → **Attach policies directly**
5. Search for **AmazonKendraReadOnlyAccess**
6. Check the box next to it
7. Click **Next** → **Add permissions**

### Option 2: Create Custom Policy (More Restrictive)

If you want to be more restrictive and only allow querying your specific Kendra index:

1. Go to AWS IAM Console → **Policies** → **Create policy**
2. Click **JSON** tab
3. Paste this policy (replace `YOUR_INDEX_ID` with your actual Kendra index ID):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "kendra:Query"
            ],
            "Resource": "arn:aws:kendra:ap-south-1:975050162024:index/3a6fd672-57b9-4668-87f7-08470e92e388"
        }
    ]
}
```

4. Click **Next** → Give it a name like `KendraQueryPolicy`
5. Click **Create policy**
6. Go back to **Users** → **study-tap-uploader** → **Add permissions** → **Attach policies directly**
7. Search for your new policy and attach it

## Verify

After adding the permission, restart your backend server and try querying again. The error should be gone.

## Note

- Your Kendra Index ID: `3a6fd672-57b9-4668-87f7-08470e92e388`
- Your AWS Region: `ap-south-1`
- Your AWS Account ID: `975050162024`

