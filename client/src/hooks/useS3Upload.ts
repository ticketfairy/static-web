import { useState, useCallback } from "react";
import { s3Uploader, S3VideoUploader } from "../utils/s3Upload";
import type { S3UploadResult } from "../utils/s3Upload";

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  result: S3UploadResult | null;
}

export interface UseS3UploadReturn {
  uploadState: UploadState;
  uploadVideo: (videoBlob: Blob, filename?: string) => Promise<S3UploadResult>;
  resetUploadState: () => void;
  isConfigured: boolean;
}

export const useS3Upload = (customUploader?: S3VideoUploader): UseS3UploadReturn => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    result: null,
  });

  const uploader = customUploader || s3Uploader;

  // Check if uploader is properly configured
  const isConfigured = Boolean(uploader);

  const uploadVideo = useCallback(
    async (videoBlob: Blob, filename?: string): Promise<S3UploadResult> => {
      setUploadState({
        isUploading: true,
        progress: 0,
        error: null,
        result: null,
      });

      try {
        const result = await uploader.uploadVideoWithProgress(videoBlob, filename, (progress) => {
          setUploadState((prev) => ({
            ...prev,
            progress,
          }));
        });

        setUploadState((prev) => ({
          ...prev,
          isUploading: false,
          result,
          error: result.success ? null : result.error || "Upload failed",
        }));

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Upload failed";

        setUploadState((prev) => ({
          ...prev,
          isUploading: false,
          error: errorMessage,
          result: { success: false, error: errorMessage },
        }));

        return { success: false, error: errorMessage };
      }
    },
    [uploader]
  );

  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      result: null,
    });
  }, []);

  return {
    uploadState,
    uploadVideo,
    resetUploadState,
    isConfigured,
  };
};
