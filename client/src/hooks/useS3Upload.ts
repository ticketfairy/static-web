import { useState, useCallback, useEffect } from "react";
import { s3Uploader, S3VideoUploader } from "../utils/s3Upload";
import type { S3UploadResult, S3ListResult, S3VideoMetadata, S3DeleteResult, TicketData, S3TicketResult } from "../utils/s3Upload";

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

export interface VideoListState {
  isLoading: boolean;
  videos: S3VideoMetadata[];
  error: string | null;
}

export interface UseS3VideoListReturn {
  listState: VideoListState;
  refreshVideoList: () => Promise<void>;
  deleteVideo: (key: string) => Promise<S3DeleteResult>;
  isConfigured: boolean;
}

export interface UseS3TicketReturn {
  saveTicket: (videoFilename: string, ticketData: Omit<TicketData, "createdAt" | "updatedAt">) => Promise<S3UploadResult>;
  loadTicket: (videoFilename: string) => Promise<S3TicketResult>;
  deleteTicket: (videoFilename: string) => Promise<S3DeleteResult>;
  updateTicket: (videoFilename: string, title: string, description: string) => Promise<S3UploadResult>;
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

export const useS3VideoList = (customUploader?: S3VideoUploader): UseS3VideoListReturn => {
  const [listState, setListState] = useState<VideoListState>({
    isLoading: false,
    videos: [],
    error: null,
  });

  const uploader = customUploader || s3Uploader;

  // Check if uploader is properly configured
  const isConfigured = Boolean(uploader);

  const refreshVideoList = useCallback(async (): Promise<void> => {
    if (!isConfigured) {
      setListState({
        isLoading: false,
        videos: [],
        error: "S3 not configured. Please set up AWS credentials.",
      });
      return;
    }

    setListState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const result: S3ListResult = await uploader.listVideos();

      setListState({
        isLoading: false,
        videos: result.success ? result.videos || [] : [],
        error: result.success ? null : result.error || "Failed to load videos",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load videos";

      setListState({
        isLoading: false,
        videos: [],
        error: errorMessage,
      });
    }
  }, [uploader, isConfigured]);

  const deleteVideo = useCallback(
    async (key: string): Promise<S3DeleteResult> => {
      if (!isConfigured) {
        return {
          success: false,
          error: "S3 not configured. Please set up AWS credentials.",
        };
      }

      try {
        const result = await uploader.deleteVideo(key);

        if (result.success) {
          // Remove the video from local state immediately
          setListState((prev) => ({
            ...prev,
            videos: prev.videos.filter((video) => video.key !== key),
          }));
        }

        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to delete video",
        };
      }
    },
    [uploader, isConfigured]
  );

  // Auto-load videos on mount if configured
  useEffect(() => {
    if (isConfigured) {
      refreshVideoList();
    }
  }, [isConfigured, refreshVideoList]);

  return {
    listState,
    refreshVideoList,
    deleteVideo,
    isConfigured,
  };
};

export const useS3Ticket = (customUploader?: S3VideoUploader): UseS3TicketReturn => {
  const uploader = customUploader || s3Uploader;

  // Check if uploader is properly configured
  const isConfigured = Boolean(uploader);

  const saveTicket = useCallback(
    async (videoFilename: string, ticketData: Omit<TicketData, "createdAt" | "updatedAt">): Promise<S3UploadResult> => {
      if (!isConfigured) {
        return {
          success: false,
          error: "S3 not configured. Please set up AWS credentials.",
        };
      }

      try {
        return await uploader.saveTicketData(videoFilename, ticketData);
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to save ticket",
        };
      }
    },
    [uploader, isConfigured]
  );

  const loadTicket = useCallback(
    async (videoFilename: string): Promise<S3TicketResult> => {
      if (!isConfigured) {
        return {
          success: false,
          error: "S3 not configured. Please set up AWS credentials.",
        };
      }

      try {
        return await uploader.loadTicketData(videoFilename);
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to load ticket",
        };
      }
    },
    [uploader, isConfigured]
  );

  const deleteTicket = useCallback(
    async (videoFilename: string): Promise<S3DeleteResult> => {
      if (!isConfigured) {
        return {
          success: false,
          error: "S3 not configured. Please set up AWS credentials.",
        };
      }

      try {
        return await uploader.deleteTicketData(videoFilename);
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to delete ticket",
        };
      }
    },
    [uploader, isConfigured]
  );

  const updateTicket = useCallback(
    async (videoFilename: string, title: string, description: string): Promise<S3UploadResult> => {
      if (!isConfigured) {
        return {
          success: false,
          error: "S3 not configured. Please set up AWS credentials.",
        };
      }

      try {
        return await uploader.updateTicketData(videoFilename, title, description);
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to update ticket",
        };
      }
    },
    [uploader, isConfigured]
  );

  return {
    saveTicket,
    loadTicket,
    deleteTicket,
    updateTicket,
    isConfigured,
  };
};
