import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Configuration for your S3 bucket
const BUCKET_NAME = "ticketfairy-production";
const REGION = "us-east-1";

// You'll need to set these environment variables or configure them
// For client-side uploads, you have a few options:
// 1. Use AWS Cognito for temporary credentials
// 2. Use presigned URLs from your backend
// 3. Use IAM roles with limited permissions

export interface S3UploadConfig {
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
}

export interface S3UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export class S3VideoUploader {
  private s3Client: S3Client | null = null;

  constructor(config?: S3UploadConfig) {
    if (config?.accessKeyId && config?.secretAccessKey) {
      this.s3Client = new S3Client({
        region: REGION,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
          sessionToken: config.sessionToken,
        },
      });
    }
  }

  // Initialize with credentials (call this when you have AWS credentials)
  initialize(config: S3UploadConfig) {
    if (config.accessKeyId && config.secretAccessKey) {
      this.s3Client = new S3Client({
        region: REGION,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
          sessionToken: config.sessionToken,
        },
      });
    }
  }

  // Generate a unique key for the video file
  private generateVideoKey(filename?: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = filename?.split(".").pop() || "webm";

    return `videos/${timestamp}-${randomId}.${extension}`;
  }

  // Upload video blob to S3
  async uploadVideo(videoBlob: Blob, filename?: string, onProgress?: (progress: number) => void): Promise<S3UploadResult> {
    if (!this.s3Client) {
      return {
        success: false,
        error: "S3 client not initialized. Please configure AWS credentials.",
      };
    }

    try {
      const key = this.generateVideoKey(filename);

      // Convert blob to ArrayBuffer for upload
      const arrayBuffer = await videoBlob.arrayBuffer();

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: new Uint8Array(arrayBuffer),
        ContentType: videoBlob.type || "video/webm",
        Metadata: {
          "uploaded-by": "ticketfairy-client",
          "upload-timestamp": new Date().toISOString(),
          "original-filename": filename || "recording",
        },
      });

      // Upload the file
      await this.s3Client.send(command);

      // Construct the public URL (if bucket is public) or return the key
      const url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;

      return {
        success: true,
        url,
        key,
      };
    } catch (error) {
      console.error("S3 upload error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  // Upload with progress tracking (for large files)
  async uploadVideoWithProgress(videoBlob: Blob, filename?: string, onProgress?: (progress: number) => void): Promise<S3UploadResult> {
    // For now, we'll use the simple upload method
    // In production, you might want to implement multipart upload for large files
    onProgress?.(0);

    const result = await this.uploadVideo(videoBlob, filename);

    onProgress?.(100);
    return result;
  }
}

// Alternative approach: Upload via presigned URL from your backend
export async function uploadVideoViaPresignedUrl(
  videoBlob: Blob,
  presignedUrl: string,
  onProgress?: (progress: number) => void
): Promise<S3UploadResult> {
  try {
    onProgress?.(0);

    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: videoBlob,
      headers: {
        "Content-Type": videoBlob.type || "video/webm",
      },
    });

    onProgress?.(100);

    if (response.ok) {
      // Extract the URL without query parameters
      const url = presignedUrl.split("?")[0];
      return {
        success: true,
        url,
      };
    } else {
      throw new Error(`Upload failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Presigned URL upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

// Utility function to get AWS credentials from environment or user input
export function getAWSCredentials(): S3UploadConfig | null {
  // Check environment variables (for development)
  const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
  const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
  const sessionToken = import.meta.env.VITE_AWS_SESSION_TOKEN;

  if (accessKeyId && secretAccessKey) {
    return {
      accessKeyId,
      secretAccessKey,
      sessionToken,
    };
  }

  return null;
}

// Default uploader instance
export const s3Uploader = new S3VideoUploader(getAWSCredentials() || undefined);
