import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

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

export interface S3VideoMetadata {
  key: string;
  url: string;
  size: number;
  lastModified: Date;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface S3ListResult {
  success: boolean;
  videos?: S3VideoMetadata[];
  error?: string;
}

export interface S3DeleteResult {
  success: boolean;
  error?: string;
}

export interface TicketData {
  title: string;
  description: string;
  videoId: string;
  indexId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface S3TicketResult {
  success: boolean;
  ticketData?: TicketData;
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
    // const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    // const randomId = Math.random().toString(36).substring(2, 8);
    const key = `videos/${filename}`;

    console.log("key", key);

    return key;
  }

  // Generate a key for the ticket JSON file based on video filename
  private generateTicketKey(videoFilename: string): string {
    // Remove the video extension and add .json
    const nameWithoutExt = videoFilename.replace(/\.[^/.]+$/, "");
    return `tickets/${nameWithoutExt}.json`;
  }

  // Upload video blob to S3
  async uploadVideo(videoBlob: Blob, filename?: string, _onProgress?: (progress: number) => void): Promise<S3UploadResult> {
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

      // Determine content type based on filename or blob type
      let contentType = videoBlob.type;
      if (!contentType || contentType === "video/webm") {
        // If no type or webm, determine from filename extension
        contentType = this.getContentTypeFromExtension(filename || "recording.mov");
      }

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: new Uint8Array(arrayBuffer),
        ContentType: contentType,
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

  // List all videos in the S3 bucket
  async listVideos(prefix: string = "videos/"): Promise<S3ListResult> {
    if (!this.s3Client) {
      return {
        success: false,
        error: "S3 client not initialized. Please configure AWS credentials.",
      };
    }

    try {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: 1000, // Adjust as needed
      });

      const response = await this.s3Client.send(command);

      if (!response.Contents) {
        return {
          success: true,
          videos: [],
        };
      }

      const videos: S3VideoMetadata[] = response.Contents.filter((object) => {
        // Filter out directories and non-video files
        return (
          object.Key &&
          object.Key !== prefix &&
          (object.Key.endsWith(".mov") || object.Key.endsWith(".mp4") || object.Key.endsWith(".webm") || object.Key.endsWith(".avi"))
        );
      })
        .map((object) => ({
          key: object.Key!,
          url: `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${object.Key}`,
          size: object.Size || 0,
          lastModified: object.LastModified || new Date(),
          contentType: this.getContentTypeFromExtension(object.Key!),
        }))
        .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime()); // Sort by newest first

      return {
        success: true,
        videos,
      };
    } catch (error) {
      console.error("S3 list error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list videos",
      };
    }
  }

  // Get detailed metadata for a specific video
  async getVideoMetadata(key: string): Promise<S3VideoMetadata | null> {
    if (!this.s3Client) {
      return null;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        key,
        url: `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`,
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        contentType: response.ContentType,
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error("Failed to get video metadata:", error);
      return null;
    }
  }

  // Delete a video from S3
  async deleteVideo(key: string): Promise<S3DeleteResult> {
    if (!this.s3Client) {
      return {
        success: false,
        error: "S3 client not initialized. Please configure AWS credentials.",
      };
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await this.s3Client.send(command);

      return {
        success: true,
      };
    } catch (error) {
      console.error("S3 delete error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete video",
      };
    }
  }

  // Save ticket data to S3 as JSON
  async saveTicketData(videoFilename: string, ticketData: Omit<TicketData, "createdAt" | "updatedAt">): Promise<S3UploadResult> {
    if (!this.s3Client) {
      return {
        success: false,
        error: "S3 client not initialized. Please configure AWS credentials.",
      };
    }

    try {
      const key = this.generateTicketKey(videoFilename);
      const now = new Date().toISOString();

      const fullTicketData: TicketData = {
        ...ticketData,
        createdAt: now,
        updatedAt: now,
      };

      const jsonContent = JSON.stringify(fullTicketData, null, 2);

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: jsonContent,
        ContentType: "application/json",
        Metadata: {
          "uploaded-by": "ticketfairy-client",
          "upload-timestamp": now,
          "video-filename": videoFilename,
        },
      });

      await this.s3Client.send(command);

      const url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;

      return {
        success: true,
        url,
        key,
      };
    } catch (error) {
      console.error("S3 ticket save error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save ticket data",
      };
    }
  }

  // Load ticket data from S3
  async loadTicketData(videoFilename: string): Promise<S3TicketResult> {
    if (!this.s3Client) {
      return {
        success: false,
        error: "S3 client not initialized. Please configure AWS credentials.",
      };
    }

    try {
      const key = this.generateTicketKey(videoFilename);

      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        return {
          success: false,
          error: "No ticket data found",
        };
      }

      // Convert the stream to string
      const bodyString = await response.Body.transformToString();
      const ticketData: TicketData = JSON.parse(bodyString);

      return {
        success: true,
        ticketData,
      };
    } catch (error) {
      // If the file doesn't exist, that's not really an error - just no ticket data yet
      if (error instanceof Error && error.name === "NoSuchKey") {
        return {
          success: false,
          error: "No ticket data found for this video",
        };
      }

      console.error("S3 ticket load error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load ticket data",
      };
    }
  }

  // Delete ticket data from S3
  async deleteTicketData(videoFilename: string): Promise<S3DeleteResult> {
    if (!this.s3Client) {
      return {
        success: false,
        error: "S3 client not initialized. Please configure AWS credentials.",
      };
    }

    try {
      const key = this.generateTicketKey(videoFilename);

      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await this.s3Client.send(command);

      return {
        success: true,
      };
    } catch (error) {
      console.error("S3 ticket delete error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete ticket data",
      };
    }
  }

  // Helper method to determine content type from file extension
  private getContentTypeFromExtension(key: string): string {
    const extension = key.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "mov":
        return "video/quicktime";
      case "mp4":
        return "video/mp4";
      case "webm":
        return "video/webm";
      case "avi":
        return "video/x-msvideo";
      default:
        return "video/quicktime"; // Default to MOV format
    }
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
