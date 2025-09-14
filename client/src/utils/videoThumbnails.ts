/**
 * Video thumbnail generation utilities
 */

import { s3Uploader } from "./s3Upload";

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  timeOffset?: number; // Time in seconds to capture thumbnail
}

/**
 * Generate a thumbnail from a video blob with optional S3 caching
 */
export const generateThumbnailFromBlob = async (videoBlob: Blob, options: ThumbnailOptions = {}, filename?: string): Promise<string> => {
  const {
    width = 320,
    height = 180,
    quality = 0.8,
    timeOffset = 1, // Capture at 1 second by default
  } = options;

  // If filename is provided, check S3 cache first
  if (filename) {
    try {
      const cachedThumbnailUrl = await s3Uploader.getThumbnailUrl(filename);
      if (cachedThumbnailUrl) {
        console.log(`Using cached thumbnail for ${filename}`);
        return cachedThumbnailUrl;
      }
    } catch (error) {
      console.warn("Error checking thumbnail cache:", error);
    }
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    const url = URL.createObjectURL(videoBlob);
    video.src = url;
    video.crossOrigin = "anonymous";
    video.muted = true; // Required for autoplay in some browsers

    video.onloadedmetadata = () => {
      // Set the time to capture the thumbnail
      video.currentTime = Math.min(timeOffset, video.duration - 0.1);
    };

    video.onseeked = () => {
      const handleThumbnailGeneration = async () => {
        try {
          // Calculate aspect ratio to maintain video proportions
          const videoAspectRatio = video.videoWidth / video.videoHeight;
          const canvasAspectRatio = width / height;

          let drawWidth = width;
          let drawHeight = height;
          let offsetX = 0;
          let offsetY = 0;

          if (videoAspectRatio > canvasAspectRatio) {
            // Video is wider than canvas
            drawHeight = width / videoAspectRatio;
            offsetY = (height - drawHeight) / 2;
          } else {
            // Video is taller than canvas
            drawWidth = height * videoAspectRatio;
            offsetX = (width - drawWidth) / 2;
          }

          // Clear canvas and draw video frame
          ctx.clearRect(0, 0, width, height);
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

          // Convert canvas to data URL
          const thumbnailDataUrl = canvas.toDataURL("image/jpeg", quality);

          // Clean up
          URL.revokeObjectURL(url);

          // Cache to S3 if filename is provided
          if (filename) {
            try {
              const uploadResult = await s3Uploader.uploadThumbnail(thumbnailDataUrl, filename);
              if (uploadResult.success && uploadResult.url) {
                console.log(`Thumbnail cached to S3 for ${filename}`);
                // Return the S3 URL instead of the data URL for consistency
                resolve(uploadResult.url);
              } else {
                console.warn("Failed to cache thumbnail to S3:", uploadResult.error);
                resolve(thumbnailDataUrl);
              }
            } catch (error) {
              console.warn("Error caching thumbnail to S3:", error);
              resolve(thumbnailDataUrl);
            }
          } else {
            resolve(thumbnailDataUrl);
          }
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      handleThumbnailGeneration();
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load video for thumbnail generation"));
    };

    // Fallback timeout
    setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error("Thumbnail generation timeout"));
    }, 10000);
  });
};

/**
 * Generate a thumbnail from a video URL (for S3 videos) with S3 caching
 */
export const generateThumbnailFromUrl = async (videoUrl: string, options: ThumbnailOptions = {}): Promise<string> => {
  // Extract filename from URL for caching
  const urlParts = videoUrl.split("/");
  const filename = urlParts[urlParts.length - 1];

  // Check if thumbnail already exists in S3 cache
  try {
    const cachedThumbnailUrl = await s3Uploader.getThumbnailUrl(filename);
    if (cachedThumbnailUrl) {
      console.log(`Using cached thumbnail for ${filename}`);
      return cachedThumbnailUrl;
    }
  } catch (error) {
    console.warn("Error checking thumbnail cache:", error);
  }

  // Generate thumbnail if not cached
  return new Promise((resolve, reject) => {
    const { width = 320, height = 180, quality = 0.8, timeOffset = 1 } = options;

    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    canvas.width = width;
    canvas.height = height;

    video.src = videoUrl;
    video.crossOrigin = "anonymous";
    video.muted = true;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(timeOffset, video.duration - 0.1);
    };

    video.onseeked = () => {
      const handleThumbnailGeneration = async () => {
        try {
          const videoAspectRatio = video.videoWidth / video.videoHeight;
          const canvasAspectRatio = width / height;

          let drawWidth = width;
          let drawHeight = height;
          let offsetX = 0;
          let offsetY = 0;

          if (videoAspectRatio > canvasAspectRatio) {
            drawHeight = width / videoAspectRatio;
            offsetY = (height - drawHeight) / 2;
          } else {
            drawWidth = height * videoAspectRatio;
            offsetX = (width - drawWidth) / 2;
          }

          ctx.clearRect(0, 0, width, height);
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

          const thumbnailDataUrl = canvas.toDataURL("image/jpeg", quality);

          // Cache the thumbnail to S3 in the background
          try {
            const uploadResult = await s3Uploader.uploadThumbnail(thumbnailDataUrl, filename);
            if (uploadResult.success && uploadResult.url) {
              console.log(`Thumbnail cached to S3 for ${filename}`);
              // Return the S3 URL instead of the data URL for consistency
              resolve(uploadResult.url);
            } else {
              console.warn("Failed to cache thumbnail to S3:", uploadResult.error);
              resolve(thumbnailDataUrl);
            }
          } catch (error) {
            console.warn("Error caching thumbnail to S3:", error);
            resolve(thumbnailDataUrl);
          }
        } catch (error) {
          reject(error);
        }
      };

      handleThumbnailGeneration();
    };

    video.onerror = () => {
      reject(new Error("Failed to load video from URL for thumbnail generation"));
    };

    setTimeout(() => {
      reject(new Error("Thumbnail generation timeout"));
    }, 15000); // Longer timeout for network videos
  });
};

/**
 * Create a placeholder thumbnail with video info
 */
export const createPlaceholderThumbnail = (_title: string, duration: string, color: string = "#805AD5"): string => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  canvas.width = 320;
  canvas.height = 180;

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, 320, 180);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, `${color}CC`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 320, 180);

  // Add video icon
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.font = '48px "Comic Sans MS", cursive, Arial';
  ctx.textAlign = "center";
  ctx.fillText("▶", 160, 100);

  // Add duration
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(250, 150, 60, 20);
  ctx.fillStyle = "white";
  ctx.font = '12px "Comic Sans MS", cursive, Arial';
  ctx.textAlign = "center";
  ctx.fillText(duration, 280, 163);

  return canvas.toDataURL("image/jpeg", 0.8);
};
