# AWS S3 Video Upload Setup

This guide explains how to configure AWS S3 for automatic video uploads to your `ticketfairy-production` bucket.

## Quick Setup

1. **Create a `.env` file** in the client directory with your AWS credentials:

```env
# AWS S3 Configuration for Video Upload
VITE_AWS_ACCESS_KEY_ID=your_access_key_here
VITE_AWS_SECRET_ACCESS_KEY=your_secret_key_here
VITE_AWS_SESSION_TOKEN=your_session_token_here  # Optional, for temporary credentials
```

2. **Restart your development server** to load the new environment variables:

```bash
npm run dev
```

## AWS Credentials Options

### Option 1: IAM User (Development)

1. Create an IAM user in AWS Console
2. Attach policy with S3 permissions for `ticketfairy-production` bucket
3. Generate access keys and add to `.env`

### Option 2: AWS Cognito (Recommended for Production)

- Use Cognito Identity Pools for temporary credentials
- More secure than hardcoded keys
- Requires backend integration

### Option 3: Presigned URLs (Most Secure)

- Generate presigned URLs from your backend
- No client-side credentials needed
- Modify `uploadVideoViaPresignedUrl` function in `src/utils/s3Upload.ts`

## Required IAM Permissions

Your AWS credentials need these permissions for the `ticketfairy-production` bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:PutObjectAcl"],
      "Resource": "arn:aws:s3:::ticketfairy-production/*"
    }
  ]
}
```

## Configuration Details

- **Bucket**: `ticketfairy-production`
- **Region**: `us-east-1`
- **Upload Path**: `videos/YYYY-MM-DDTHH-MM-SS-randomid.webm`

## Troubleshooting

### "S3 not configured" warning

- Check that your `.env` file exists and has the correct variable names
- Restart your dev server after creating/modifying `.env`
- Verify that variables start with `VITE_` prefix

### Upload fails with permissions error

- Check your IAM permissions match the required permissions above
- Verify the bucket name and region are correct
- Check AWS credentials are valid and not expired

### CORS Issues

If you encounter CORS errors, add this CORS configuration to your S3 bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST"],
    "AllowedOrigins": ["http://localhost:5173", "https://yourdomain.com"],
    "ExposeHeaders": []
  }
]
```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use least privilege** - only grant necessary S3 permissions
3. **Consider temporary credentials** for production
4. **Implement backend validation** for uploaded content
5. **Set up bucket policies** to restrict access as needed

## Current Implementation

Videos are automatically uploaded to S3 after recording or file upload. The UI shows:

- ☁️ Cloud icon for uploaded videos
- Upload progress bar during upload
- Success/error notifications
- S3 URLs in "Get Link" functionality
