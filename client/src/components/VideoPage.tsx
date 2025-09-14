import {
  Box,
  Button,
  VStack,
  Heading,
  useColorModeValue,
  Icon,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  ModalHeader,
  ModalFooter,
  useDisclosure,
  Input,
  useToast,
  Text,
  SimpleGrid,
  Textarea,
  Progress,
  Alert,
  AlertIcon,
  Code,
  HStack,
} from "@chakra-ui/react";
import { FiVideo, FiUpload, FiCamera, FiArrowLeft, FiCloud, FiTrash2, FiCopy, FiPlay } from "react-icons/fi";
import { ThemeToggle } from "./ThemeToggle";
import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useScreenRecording } from "../hooks/useScreenRecording";
import SparkleTrail from "./SparkleTrail";

// API function to call Flask analyze_video endpoint
const analyzeVideo = async (videoUrl: string, userNotes: string) => {
  console.log("Calling analyze_video API with URL:", videoUrl);
  try {
    const response = await fetch("http://localhost:4000/analyze-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_url: videoUrl,
        user_notes: userNotes,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error calling analyze_video API:", error);
    throw error;
  }
};
import { RecordingModal } from "./RecordingModal";
import { FloatingRecordingControls } from "./FloatingRecordingControls";
import { DraggableWebcamOverlay } from "./DraggableWebcamOverlay";
import { VideoPreviewModal } from "./VideoPreviewModal";
import { VideoPlayerModal } from "./VideoPlayerModal";
import { RecordingIndicator } from "./RecordingIndicator";
import { PermissionsPopup } from "./PermissionsPopup";
import { ReadyToRecordModal } from "./ReadyToRecordModal";
import ClaudeAgentModal from "./ClaudeAgentModal";
import { GitHubIssueModal } from "./GitHubIssueModal";
import { useSaveToVideos } from "./SaveToVideosButton";
import { generateRecordingFilename, checkBrowserSupport, getBrowserInfo } from "../utils/recordingHelpers";
import { useS3Upload, useS3VideoList, useS3Ticket } from "../hooks/useS3Upload";
import type { S3VideoMetadata, TicketData } from "../utils/s3Upload";
import { generateThumbnailFromBlob, generateThumbnailFromUrl, createPlaceholderThumbnail } from "../utils/videoThumbnails";

interface VideoPageProps {
  onNavigateToTickets: () => void;
  onNavigateToLanding?: () => void;
}

function VideoPage({ onNavigateToTickets: _onNavigateToTickets, onNavigateToLanding }: VideoPageProps) {
  const bgColor = useColorModeValue("white", "gray.900");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isRecordingModalOpen, onOpen: onRecordingModalOpen, onClose: onRecordingModalClose } = useDisclosure();
  const { isOpen: isVideoPreviewOpen, onClose: onVideoPreviewClose } = useDisclosure();
  const { isOpen: isTicketModalOpen, onOpen: onTicketModalOpen, onClose: onTicketModalClose } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
  const { isOpen: isVideoPlayerOpen, onOpen: onVideoPlayerOpen, onClose: onVideoPlayerClose } = useDisclosure();

  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<VideoItem | null>(null);
  const [videoToPlay, setVideoToPlay] = useState<VideoItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [s3VideoThumbnails, setS3VideoThumbnails] = useState<Record<string, string>>({});
  const [generatingThumbnails, setGeneratingThumbnails] = useState<Set<string>>(new Set());
  const [videoTickets, setVideoTickets] = useState<Record<string, any>>({});
  const [analyzingVideos, setAnalyzingVideos] = useState<Set<string>>(new Set());
  const [s3VideoDurations, setS3VideoDurations] = useState<Record<string, string>>({});
  const [loadingDurations, setLoadingDurations] = useState<Set<string>>(new Set());
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const { isOpen: isTicketResultModalOpen, onOpen: onTicketResultModalOpen, onClose: onTicketResultModalClose } = useDisclosure();
  const [enhancementContexts, setEnhancementContexts] = useState<Record<string, string>>({});
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedTicket, setEnhancedTicket] = useState<any>(null);
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentDescription, setCurrentDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { isOpen: isClaudeAgentModalOpen, onOpen: onClaudeAgentModalOpen, onClose: onClaudeAgentModalClose } = useDisclosure();
  const { isOpen: isGitHubIssueModalOpen, onOpen: onGitHubIssueModalOpen, onClose: onGitHubIssueModalClose } = useDisclosure();

  // Dynamic video collection state
  interface VideoItem {
    id: string;
    title: string;
    description: string;
    duration: string;
    thumbnailColor: string;
    thumbnailIconColor: string;
    thumbnailUrl?: string; // Data URL for the video thumbnail
    notes: string;
    blob?: Blob;
    createdAt: Date;
    s3Url?: string;
    s3Key?: string;
    filename?: string; // Original filename for display
    isUploading?: boolean;
    uploadProgress?: number;
  }

  const [videos, setVideos] = useState<VideoItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const { saveToVideos } = useSaveToVideos();
  const { uploadVideo, isConfigured: isS3Configured } = useS3Upload();

  // S3 video listing hook
  const { listState, refreshVideoList, deleteVideo: deleteS3Video, isConfigured: isS3ListConfigured } = useS3VideoList();

  // S3 ticket persistence hook
  const { saveTicket, loadTicket, deleteTicket: deleteS3Ticket, updateTicket, isConfigured: isS3TicketConfigured } = useS3Ticket();

  // Helper function to convert S3 video to VideoItem format
  const convertS3VideoToVideoItem = useCallback(
    (s3Video: S3VideoMetadata): VideoItem => {
      // Extract info from S3 key (e.g., "videos/2025-09-13T19-12-46-728Z-yopjxw.mov")
      const keyParts = s3Video.key.split("/");
      const filename = keyParts[keyParts.length - 1];

      // Check if we have a ticket for this video and use its title
      const videoTicket = videoTickets[s3Video.key];
      let title = filename; // Default to filename

      if (videoTicket && videoTicket.success && videoTicket.ticket && videoTicket.ticket.title) {
        title = videoTicket.ticket.title;
      }

      let createdAt = s3Video.lastModified;

      // Use cached duration if available, otherwise show loading
      const cachedDuration = s3VideoDurations[s3Video.key];
      const durationString = cachedDuration || "Loading...";

      // Use cached thumbnail if available, otherwise create placeholder
      const cachedThumbnail = s3VideoThumbnails[s3Video.key];
      const thumbnailUrl = cachedThumbnail || createPlaceholderThumbnail(title, durationString, "#319795");

      return {
        id: s3Video.key,
        title,
        description: `Video uploaded to S3 (${(s3Video.size / (1024 * 1024)).toFixed(1)} MB)`,
        duration: durationString,
        thumbnailColor: "teal.100",
        thumbnailIconColor: "teal.500",
        thumbnailUrl,
        notes: "",
        createdAt,
        s3Url: s3Video.url,
        s3Key: s3Video.key,
        filename, // Store original filename for display
      };
    },
    [s3VideoThumbnails, videoTickets, s3VideoDurations]
  );

  // Merge local videos with S3 videos
  const allVideos = useMemo(() => {
    const s3Videos = listState.videos.map(convertS3VideoToVideoItem);
    const localVideos = videos.filter((video) => !video.s3Key); // Only include local videos without S3 keys

    // Combine and sort by creation date (newest first)
    return [...s3Videos, ...localVideos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [listState.videos, videos, s3VideoThumbnails, convertS3VideoToVideoItem]);

  // Load existing tickets for S3 videos
  const loadExistingTickets = useCallback(async () => {
    if (!isS3TicketConfigured || listState.videos.length === 0) return;

    const videosNeedingTickets = listState.videos.filter((video) => {
      const videoId = video.key;
      return !videoTickets[videoId] && !analyzingVideos.has(videoId);
    });

    if (videosNeedingTickets.length === 0) return;

    console.log(`Loading existing tickets for ${videosNeedingTickets.length} videos...`);

    for (const s3Video of videosNeedingTickets) {
      try {
        // Extract filename from S3 key
        const keyParts = s3Video.key.split("/");
        const filename = keyParts[keyParts.length - 1];

        const ticketResult = await loadTicket(filename);

        if (ticketResult.success && ticketResult.ticketData) {
          // Convert the persisted ticket data back to the expected format
          const mockApiResult = {
            success: true,
            ticket: {
              title: ticketResult.ticketData.title,
              description: ticketResult.ticketData.description,
            },
            video_id: ticketResult.ticketData.videoId,
            index_id: ticketResult.ticketData.indexId,
          };

          // Store the ticket result for this video
          setVideoTickets((prev) => ({
            ...prev,
            [s3Video.key]: mockApiResult,
          }));

          console.log(`Loaded existing ticket for ${filename}`);
        }
      } catch (error) {
        console.warn(`Failed to load ticket for ${s3Video.key}:`, error);
      }
    }
  }, [listState.videos, videoTickets, analyzingVideos, isS3TicketConfigured, loadTicket]);

  // Generate real thumbnails for S3 videos asynchronously
  const generateS3Thumbnails = useCallback(async () => {
    const s3VideosNeedingThumbnails = listState.videos.filter(
      (video) => !s3VideoThumbnails[video.key] && !generatingThumbnails.has(video.key)
    );

    if (s3VideosNeedingThumbnails.length === 0) return;

    // Mark videos as being processed
    setGeneratingThumbnails((prev) => {
      const newSet = new Set(prev);
      s3VideosNeedingThumbnails.forEach((video) => newSet.add(video.key));
      return newSet;
    });

    for (const s3Video of s3VideosNeedingThumbnails) {
      try {
        const realThumbnail = await generateThumbnailFromUrl(s3Video.url, {
          width: 320,
          height: 180,
          timeOffset: 2,
        });

        // Cache the thumbnail
        setS3VideoThumbnails((prev) => ({
          ...prev,
          [s3Video.key]: realThumbnail,
        }));
      } catch (error) {
        console.warn(`Failed to generate thumbnail for ${s3Video.key}:`, error);
      } finally {
        // Remove from generating set
        setGeneratingThumbnails((prev) => {
          const newSet = new Set(prev);
          newSet.delete(s3Video.key);
          return newSet;
        });
      }
    }
  }, [listState.videos, s3VideoThumbnails, generatingThumbnails]);

  // Generate real durations for S3 videos asynchronously
  const generateS3Durations = useCallback(async () => {
    const s3VideosNeedingDurations = listState.videos.filter((video) => !s3VideoDurations[video.key] && !loadingDurations.has(video.key));

    if (s3VideosNeedingDurations.length === 0) return;

    // Mark videos as being processed
    setLoadingDurations((prev) => {
      const newSet = new Set(prev);
      s3VideosNeedingDurations.forEach((video) => newSet.add(video.key));
      return newSet;
    });

    for (const s3Video of s3VideosNeedingDurations) {
      try {
        // Create a video element to get the real duration
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.preload = "metadata"; // Only load metadata, not the full video
        video.muted = true; // Helps with autoplay policies

        await new Promise<void>((resolve) => {
          let resolved = false;

          const cleanup = () => {
            if (!resolved) {
              resolved = true;
              video.src = "";
              video.load(); // Clear the video element
            }
          };

          video.onloadedmetadata = () => {
            if (resolved) return;

            const duration = video.duration;
            if (isNaN(duration) || duration === 0) {
              console.warn(`Invalid duration for ${s3Video.key}: ${duration}`);
              setS3VideoDurations((prev) => ({
                ...prev,
                [s3Video.key]: "Unknown",
              }));
            } else {
              const minutes = Math.floor(duration / 60);
              const seconds = Math.floor(duration % 60);
              const durationString = `${minutes}:${seconds.toString().padStart(2, "0")}`;

              // Cache the duration
              setS3VideoDurations((prev) => ({
                ...prev,
                [s3Video.key]: durationString,
              }));
            }

            cleanup();
            resolve();
          };

          video.onerror = (error) => {
            if (resolved) return;
            console.warn(`Failed to load video metadata for ${s3Video.key}:`, error);
            // Set a fallback duration
            setS3VideoDurations((prev) => ({
              ...prev,
              [s3Video.key]: "Unknown",
            }));
            cleanup();
            resolve();
          };

          // Reduced timeout and better logging
          const timeoutId = setTimeout(() => {
            if (resolved) return;
            console.warn(`Timeout loading video metadata for ${s3Video.key} - this may indicate CORS issues or slow network`);
            setS3VideoDurations((prev) => ({
              ...prev,
              [s3Video.key]: "Unknown",
            }));
            cleanup();
            resolve();
          }, 5000); // Reduced from 10s to 5s

          // Set the source after setting up event listeners
          video.src = s3Video.url;
        });
      } catch (error) {
        console.warn(`Failed to get duration for ${s3Video.key}:`, error);
        // Set fallback duration
        setS3VideoDurations((prev) => ({
          ...prev,
          [s3Video.key]: "Unknown",
        }));
      } finally {
        // Remove from loading set
        setLoadingDurations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(s3Video.key);
          return newSet;
        });
      }
    }
  }, [listState.videos, s3VideoDurations, loadingDurations]);

  // Trigger S3 thumbnail generation when S3 videos are loaded
  useEffect(() => {
    if (listState.videos.length > 0 && !listState.isLoading) {
      // Small delay to allow UI to render first
      setTimeout(() => {
        generateS3Thumbnails();
      }, 1000);
    }
  }, [listState.videos, listState.isLoading, generateS3Thumbnails]);

  // Trigger S3 duration generation when S3 videos are loaded
  useEffect(() => {
    if (listState.videos.length > 0 && !listState.isLoading) {
      // Small delay to allow UI to render first, and after thumbnails start loading
      setTimeout(() => {
        generateS3Durations();
      }, 1500);
    }
  }, [listState.videos, listState.isLoading, generateS3Durations]);

  // Load existing tickets when S3 videos are loaded
  useEffect(() => {
    if (listState.videos.length > 0 && !listState.isLoading && isS3TicketConfigured) {
      // Small delay to allow video state to settle
      setTimeout(() => {
        loadExistingTickets();
      }, 1500);
    }
  }, [listState.videos, listState.isLoading, isS3TicketConfigured, loadExistingTickets]);

  // Helper function to generate video duration from blob
  const getVideoDuration = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(blob);
      video.src = url;
      video.onloadedmetadata = () => {
        const duration = video.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        URL.revokeObjectURL(url);
        resolve(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      };
      // Fallback if metadata doesn't load
      setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve("0:00");
      }, 3000);
    });
  };

  // Helper function to analyze video and store ticket
  const analyzeVideoAndStoreTicket = async (videoId: string, s3Url: string, videoFilename?: string) => {
    // Mark video as analyzing
    setAnalyzingVideos((prev) => new Set(prev).add(videoId));

    try {
      const result = await analyzeVideo(s3Url, "");
      console.log("API Result for video", videoId, ":", result);

      // Store the ticket result for this video
      setVideoTickets((prev) => ({
        ...prev,
        [videoId]: result,
      }));

      // Save ticket data to S3 if we have a successful ticket and S3 is configured
      if (result.success && result.ticket && videoFilename && isS3TicketConfigured) {
        try {
          const ticketData: Omit<TicketData, "createdAt" | "updatedAt"> = {
            title: result.ticket.title,
            description: result.ticket.description,
            videoId: result.video_id || videoId,
            indexId: result.index_id,
          };

          const saveResult = await saveTicket(videoFilename, ticketData);

          if (saveResult.success) {
            console.log("Ticket data saved to S3 successfully");
          } else {
            console.warn("Failed to save ticket data to S3:", saveResult.error);
          }
        } catch (ticketSaveError) {
          console.warn("Error saving ticket to S3:", ticketSaveError);
        }
      }

      toast({
        title: "Video Analysis Complete!",
        description: "Ticket has been generated for your video",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Failed to analyze video:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze video. You can try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      // Remove from analyzing set
      setAnalyzingVideos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    }
  };

  // Helper function to upload video to S3
  const uploadVideoToS3 = async (blob: Blob, videoId: string, filename?: string) => {
    if (!isS3Configured) {
      console.warn("S3 not configured, skipping upload");
      return;
    }

    // Set uploading state for this video
    setVideos((prev) => prev.map((video) => (video.id === videoId ? { ...video, isUploading: true, uploadProgress: 0 } : video)));

    try {
      const result = await uploadVideo(blob, filename);

      if (result.success) {
        // Update video with S3 information
        setVideos((prev) =>
          prev.map((video) =>
            video.id === videoId
              ? {
                  ...video,
                  s3Url: result.url,
                  s3Key: result.key,
                  isUploading: false,
                  uploadProgress: 100,
                }
              : video
          )
        );

        toast({
          title: "Video Uploaded to Cloud!",
          description: "Your video has been successfully uploaded to S3",
          status: "success",
          duration: 4000,
          isClosable: true,
        });

        // Automatically trigger video analysis after upload
        setTimeout(() => {
          analyzeVideoAndStoreTicket(videoId, result.url!, filename);
        }, 2000); // Small delay to ensure S3 is ready

        // Refresh the S3 video list to include the newly uploaded video
        if (isS3ListConfigured) {
          setTimeout(() => {
            refreshVideoList();
          }, 1000); // Small delay to ensure S3 is consistent
        }
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("S3 upload failed:", error);

      // Reset uploading state
      setVideos((prev) => prev.map((video) => (video.id === videoId ? { ...video, isUploading: false, uploadProgress: 0 } : video)));

      toast({
        title: "Cloud Upload Failed",
        description: `Failed to upload video to S3: ${error instanceof Error ? error.message : "Unknown error"}`,
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    }
  };

  // Helper function to generate unique filename
  const generateUniqueFilename = (baseFilename: string): string => {
    // Get all existing video titles from both local and S3 videos
    const existingTitles = allVideos.map((video) => video.filename);

    // If the base filename doesn't exist, return it as is
    if (!existingTitles.includes(baseFilename)) {
      return baseFilename;
    }

    // Extract the name and extension
    const lastDotIndex = baseFilename.lastIndexOf(".");
    const name = lastDotIndex > 0 ? baseFilename.substring(0, lastDotIndex) : baseFilename;
    const extension = lastDotIndex > 0 ? baseFilename.substring(lastDotIndex) : "";

    // Find the next available number
    let counter = 1;
    let newFilename: string;

    do {
      newFilename = `${name} (${counter})${extension}`;
      counter++;
    } while (existingTitles.includes(newFilename));

    return newFilename;
  };

  // Helper function to add new video to collection
  const addVideoToCollection = async (blob: Blob, title = "Screen Recording.mov") => {
    const duration = await getVideoDuration(blob);
    const timestamp = new Date();

    // Format timestamp as requested: "MM/DD/YYYY HH:MM:SS"
    const formattedTimestamp = `${(timestamp.getMonth() + 1).toString().padStart(2, "0")}/${timestamp
      .getDate()
      .toString()
      .padStart(2, "0")}/${timestamp.getFullYear()} ${timestamp.getHours().toString().padStart(2, "0")}:${timestamp
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${timestamp.getSeconds().toString().padStart(2, "0")}`;

    // Generate unique title to avoid duplicates
    const baseTitle = title || formattedTimestamp;
    const uniqueTitle = generateUniqueFilename(baseTitle);

    // Generate thumbnail for the video with S3 caching if title is provided
    let thumbnailUrl: string | undefined;
    try {
      // Use title as filename for S3 caching if available
      const filename = title || uniqueTitle;
      thumbnailUrl = await generateThumbnailFromBlob(
        blob,
        {
          width: 320,
          height: 180,
          timeOffset: 1,
        },
        filename
      );
    } catch (error) {
      console.warn("Failed to generate thumbnail:", error);
      // Fallback to placeholder thumbnail
      thumbnailUrl = createPlaceholderThumbnail(uniqueTitle, duration, "#805AD5");
    }

    const newVideo: VideoItem = {
      id: `video-${timestamp.getTime()}`,
      title: uniqueTitle,
      description: "Screen recording with webcam",
      duration,
      thumbnailColor: "purple.100",
      thumbnailIconColor: "purple.500",
      thumbnailUrl,
      notes: "",
      blob,
      createdAt: timestamp,
      filename: title || uniqueTitle, // Store the original filename for ticket deletion
      isUploading: false,
      uploadProgress: 0,
    };

    // Add to the beginning of the videos array (most recent first)
    setVideos((prev) => [newVideo, ...prev]);

    // Automatically upload to S3 if configured
    if (isS3Configured) {
      // Use setTimeout to ensure the video is added to state first
      setTimeout(() => {
        uploadVideoToS3(blob, newVideo.id, uniqueTitle);
      }, 100);
    }

    return newVideo;
  };

  // Helper function to handle delete video confirmation
  const handleDeleteVideo = (video: VideoItem) => {
    setVideoToDelete(video);
    onDeleteModalOpen();
  };

  // Helper function to handle play video
  const handlePlayVideo = (video: VideoItem) => {
    setVideoToPlay(video);
    onVideoPlayerOpen();

    // Check if this video has a ticket and automatically show it
    const videoTicket = videoTickets[video.id];
    if (videoTicket) {
      setSelectedTicket(videoTicket);
      onTicketModalOpen();
    }
  };

  // Helper function to confirm and delete video
  const confirmDeleteVideo = async () => {
    if (!videoToDelete) return;

    setIsDeleting(true);

    try {
      // If it's an S3 video, delete from S3
      if (videoToDelete.s3Key) {
        const result = await deleteS3Video(videoToDelete.s3Key);
        if (!result.success) {
          throw new Error(result.error || "Failed to delete video from S3");
        }

        // Also delete the associated ticket data if S3 ticket is configured
        if (isS3TicketConfigured) {
          try {
            // Use the original filename, not the display title
            const filenameToUse = videoToDelete.filename || videoToDelete.title;
            await deleteS3Ticket(filenameToUse);
            console.log("Associated ticket data deleted from S3");
          } catch (ticketDeleteError) {
            console.warn("Failed to delete ticket data:", ticketDeleteError);
            // Don't fail the whole operation if ticket deletion fails
          }
        }
      }

      // Remove from local videos state (for both local and S3 videos)
      setVideos((prev) => prev.filter((video) => video.id !== videoToDelete.id));

      // Remove from video tickets state
      setVideoTickets((prev) => {
        const newTickets = { ...prev };
        delete newTickets[videoToDelete.id];
        return newTickets;
      });

      toast({
        title: "Video Deleted",
        description: `"${videoToDelete.title}" has been deleted successfully`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Failed to delete video:", error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete video",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      setVideoToDelete(null);
      onDeleteModalClose();
    }
  };

  const {
    state,
    streams,
    startRecording,
    stopRecording,
    requestPermissions,
    requestWebcamOnly,
    startCountdownAndRecord,
    cleanup,
    hidePermissionsPopup,
    requestScreenAndStart,
  } = useScreenRecording();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      console.log("File selected:", file.name);

      // Show processing toast
      toast({
        title: "Processing Upload...",
        description: "Adding your video to the collection",
        status: "info",
        duration: 2000,
        isClosable: true,
      });

      try {
        // Convert File to Blob and add to collection
        const blob = new Blob([file], { type: file.type });
        const fileName = file.name;
        const newVideo = await addVideoToCollection(blob, fileName);

        toast({
          title: "Video Uploaded!",
          description: `"${newVideo.title}" has been added to your video collection`,
          status: "success",
          duration: 4000,
          isClosable: true,
        });

        // Close the modal
        onClose();
      } catch (error) {
        toast({
          title: "Upload Error",
          description: "Failed to process uploaded video. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        console.error("Failed to process uploaded video:", error);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRecordClick = async () => {
    const browserSupport = checkBrowserSupport();
    const browserInfo = getBrowserInfo();

    if (!browserSupport.isSupported) {
      toast({
        title: "Browser Not Supported",
        description: `Your browser is missing: ${browserSupport.missingFeatures.join(
          ", "
        )}. Please use Chrome or a Chromium-based browser.`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!browserInfo.isSupported) {
      toast({
        title: "Unsupported Browser",
        description: "Screen recording works best with Chrome or Chromium-based browsers. Some features may not work properly.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
    }

    // Close modal first
    onClose();

    // Request webcam only - permissions popup will show automatically
    const webcamSuccess = await requestWebcamOnly();
    if (webcamSuccess) {
      // Webcam circle and permissions popup will appear
    }
  };

  const handleStopRecording = async () => {
    try {
      const recordingBlob = await stopRecording();

      if (recordingBlob) {
        console.log("Recording blob received:", recordingBlob.size, "bytes");
        setRecordedVideo(recordingBlob);

        // Auto-save to video collection
        toast({
          title: "Processing Recording...",
          description: "Saving your recording to the video collection",
          status: "info",
          duration: 2000,
          isClosable: true,
        });

        const baseFilename = "Screen Recording.mov";
        const uniqueFilename = generateUniqueFilename(baseFilename);

        await addVideoToCollection(recordingBlob, uniqueFilename);

        // Clean up webcam stream and reset to initial state
        cleanup();

        // Don't open preview modal - just return to Create Video button state
      } else {
        toast({
          title: "Recording Error",
          description: "No recording data available. Please try recording again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Failed to process recording. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Failed to process recording:", error);
    }
  };

  const handleRecordingModalClose = () => {
    cleanup();
    onRecordingModalClose();
  };

  const handleSaveToVideos = async (blob: Blob) => {
    const filename = generateRecordingFilename();
    await saveToVideos(blob, filename);
  };

  const handleConvertToTicket = () => {
    onVideoPreviewClose();
    onTicketModalOpen();
  };

  const handleRetakeRecording = () => {
    onVideoPreviewClose();
    setRecordedVideo(null);
    cleanup();
    onRecordingModalOpen();
  };

  const handleSaveTicket = (ticketData: any) => {
    console.log("Saving ticket:", ticketData);
    toast({
      title: "Ticket Saved",
      description: "Your AI-generated ticket has been saved to your project!",
      status: "success",
      duration: 5000,
      isClosable: true,
    });
  };

  // Function to enhance ticket with Cohere
  const enhanceTicketWithContext = async (videoId?: string) => {
    const currentVideoId = videoId || videoToPlay?.id;
    const currentEnhancementContext = currentVideoId ? enhancementContexts[currentVideoId] || "" : "";

    if (!selectedTicket || !selectedTicket.success || !selectedTicket.ticket || !currentEnhancementContext.trim()) {
      toast({
        title: "Enhancement Failed",
        description: "Please provide context to enhance the ticket",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsEnhancing(true);

    try {
      const response = await fetch("http://localhost:4000/enhance-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: selectedTicket.ticket.title,
          description: selectedTicket.ticket.description,
          context: currentEnhancementContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Create enhanced ticket object
        const enhanced = {
          ...selectedTicket,
          ticket: {
            title: result.title,
            description: result.description,
          },
        };

        console.log("Enhanced ticket:", enhanced);

        setEnhancedTicket(enhanced);

        toast({
          title: "Ticket Enhanced!",
          description: "Your ticket has been improved with the additional context",
          status: "success",
          duration: 4000,
          isClosable: true,
        });
      } else {
        throw new Error(result.error || "Enhancement failed");
      }
    } catch (error) {
      console.error("Error enhancing ticket:", error);
      toast({
        title: "Enhancement Failed",
        description: "Could not enhance ticket. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  // Function to reset enhancement
  const resetEnhancement = (videoId?: string) => {
    setEnhancedTicket(null);
    const currentVideoId = videoId || videoToPlay?.id;
    if (currentVideoId) {
      setEnhancementContexts((prev) => ({
        ...prev,
        [currentVideoId]: "",
      }));
    }
  };

  // Helper function to handle enhancement context change
  const handleEnhancementContextChange = (value: string, videoId?: string) => {
    const currentVideoId = videoId || videoToPlay?.id;
    if (currentVideoId) {
      setEnhancementContexts((prev) => ({
        ...prev,
        [currentVideoId]: value,
      }));
    }
  };

  // Initialize current values when ticket changes
  const initializeCurrentValues = () => {
    const ticketToUse = enhancedTicket || selectedTicket;
    if (ticketToUse && ticketToUse.success && ticketToUse.ticket) {
      setCurrentTitle(ticketToUse.ticket.title);
      setCurrentDescription(ticketToUse.ticket.description);
      setHasUnsavedChanges(false);
    }
  };

  // Initialize values when selectedTicket or enhancedTicket changes
  React.useEffect(() => {
    initializeCurrentValues();
  }, [selectedTicket, enhancedTicket]);

  // Function to auto-save changes
  const autoSaveChanges = async () => {
    if (!selectedTicket || !currentTitle.trim() || !currentDescription.trim() || !hasUnsavedChanges) {
      return;
    }

    setIsSaving(true);

    try {
      // Find the video filename for S3 update
      const videoKey = Object.keys(videoTickets).find((key) => videoTickets[key] === selectedTicket);
      if (!videoKey) {
        throw new Error("Could not find associated video for this ticket");
      }

      // Extract filename from S3 key or use the key itself
      const keyParts = videoKey.split("/");
      const filename = keyParts[keyParts.length - 1];

      // Update ticket in S3
      if (isS3TicketConfigured) {
        const updateResult = await updateTicket(filename, currentTitle, currentDescription);

        if (!updateResult.success) {
          throw new Error(updateResult.error || "Failed to save to S3");
        }
      }

      // Update local state
      const updatedTicket = {
        ...selectedTicket,
        ticket: {
          ...selectedTicket.ticket,
          title: currentTitle,
          description: currentDescription,
        },
      };

      // Update the ticket in local state
      setVideoTickets((prev) => ({
        ...prev,
        [videoKey]: updatedTicket,
      }));

      // Update selected ticket and enhanced ticket if it exists
      setSelectedTicket(updatedTicket);
      if (enhancedTicket) {
        setEnhancedTicket(updatedTicket);
      }

      setHasUnsavedChanges(false);

      toast({
        title: "Saved!",
        description: "Changes saved automatically",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error auto-saving ticket:", error);
      toast({
        title: "Auto-save Failed",
        description: "Changes could not be saved automatically",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle title change
  const handleTitleChange = (value: string) => {
    setCurrentTitle(value);
    setHasUnsavedChanges(true);
  };

  // Handle description change
  const handleDescriptionChange = (value: string) => {
    setCurrentDescription(value);
    setHasUnsavedChanges(true);
  };

  return (
    <Box bg={bgColor} minH="100vh" width="100vw" display="flex" flexDirection="column">
      <SparkleTrail />
      {/* Back Button */}
      {onNavigateToLanding && (
        <Box p={4} display="flex" justifyContent="space-between" alignItems="center">
          <Button leftIcon={<Icon as={FiArrowLeft} />} variant="ghost" onClick={onNavigateToLanding}>
            Back to Home
          </Button>
          <ThemeToggle />
        </Box>
      )}
      
      {/* Theme toggle for when there's no back button */}
      {!onNavigateToLanding && (
        <Box p={4} display="flex" justifyContent="flex-end">
          <ThemeToggle />
        </Box>
      )}

      {/* Video Page Content */}
      <VStack spacing={12} textAlign="center" py={16} px={4} maxW="1400px" mx="auto" flex="1" justify="flex-start" align="center">
        {/* Enhanced Header Section */}
        <VStack spacing={6} maxW="800px">
          <VStack spacing={4}>
            <Heading
              fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
              fontFamily="'CS Gordon', 'Arial Black', 'Helvetica Neue', Arial, sans-serif"
              fontWeight="extrabold"
              bgGradient="linear(to-r, purple.500, pink.500, purple.600)"
              bgClip="text"
              textAlign="center"
              lineHeight="1.1">
              ✨ Ticket Fairy Studio ✨
            </Heading>
          </VStack>

          {/* Feature highlights */}
          <HStack spacing={8} flexWrap="wrap" justify="center" pt={4}>
            <VStack spacing={1}>
              <Text fontSize="2xl">🎥</Text>
              <Text fontSize="sm" color="gray.500" fontWeight="medium">
                Screen Recording
              </Text>
            </VStack>
            <VStack spacing={1}>
              <Text fontSize="2xl">🤖</Text>
              <Text fontSize="sm" color="gray.500" fontWeight="medium">
                AI Analysis
              </Text>
            </VStack>
            <VStack spacing={1}>
              <Text fontSize="2xl">📋</Text>
              <Text fontSize="sm" color="gray.500" fontWeight="medium">
                Auto Tickets
              </Text>
            </VStack>
            <VStack spacing={1}>
              <Text fontSize="2xl">☁️</Text>
              <Text fontSize="sm" color="gray.500" fontWeight="medium">
                Cloud Storage
              </Text>
            </VStack>
          </HStack>
        </VStack>

        {/* Create Video Section */}
        {!streams.webcamStream ? (
          <VStack spacing={6}>
            <Box
              p={8}
              bg="linear-gradient(135deg, purple.50 0%, pink.50 100%)"
              borderRadius="2xl"
              borderWidth="2px"
              borderColor="purple.200"
              shadow="xl"
              _hover={{
                transform: "translateY(-2px)",
                shadow: "2xl",
                borderColor: "purple.300",
              }}
              transition="all 0.3s ease">
              <VStack spacing={4}>
                <Text fontSize="lg" color="gray.700" fontWeight="medium">
                  Ready to create your first video?
                </Text>
                <Button
                  colorScheme="purple"
                  size="xl"
                  h="80px"
                  px="60px"
                  fontSize="2xl"
                  fontWeight="bold"
                  fontFamily="'CS Gordon', 'Arial Black', 'Helvetica Neue', Arial, sans-serif"
                  rightIcon={<Icon as={FiVideo} w={8} h={8} />}
                  onClick={onOpen}
                  bgGradient="linear(to-r, purple.500, pink.500)"
                  _hover={{
                    bgGradient: "linear(to-r, purple.600, pink.600)",
                    transform: "scale(1.05)",
                  }}
                  shadow="lg"
                  borderRadius="xl">
                  Create Video
                </Button>
              </VStack>
            </Box>
          </VStack>
        ) : (
          <VStack spacing={6}>
            <Box p={8} bg="green.50" borderRadius="2xl" borderWidth="2px" borderColor="green.200" shadow="lg">
              <VStack spacing={4}>
                <Text fontSize="lg" color="green.700" fontWeight="medium">
                  📹 Recording Setup Active
                </Text>
                <Text fontSize="md" color="gray.600" textAlign="center" maxW="400px">
                  Position your webcam overlay where you'd like it to appear, then click Record to start capturing your screen.
                </Text>

                <Button
                  colorScheme={state.isRecording ? "red" : "green"}
                  size="xl"
                  h="80px"
                  px="60px"
                  fontSize="2xl"
                  fontWeight="bold"
                  rightIcon={<Icon as={state.isRecording ? FiVideo : FiCamera} w={8} h={8} />}
                  onClick={state.isRecording ? handleStopRecording : () => startCountdownAndRecord()}
                  isLoading={state.isCountingDown || state.isPreparing}
                  loadingText={state.isCountingDown ? `Starting in ${state.countdown}...` : "Preparing..."}
                  shadow="lg"
                  borderRadius="xl"
                  _hover={{
                    transform: "scale(1.05)",
                  }}>
                  {state.isRecording ? "Stop Recording" : "Record"}
                </Button>

                {state.isRecording && (
                  <HStack spacing={2}>
                    <Box w={3} h={3} bg="red.500" borderRadius="full" animation="pulse 2s infinite" />
                    <Text fontSize="md" color="red.600" fontWeight="bold">
                      Recording in progress...
                    </Text>
                  </HStack>
                )}
              </VStack>
            </Box>
          </VStack>
        )}

        {/* S3 Configuration Status */}
        {!isS3Configured && (
          <Box maxW="700px" w="full">
            <Alert status="info" borderRadius="xl" bg="blue.50" borderColor="blue.200" borderWidth="1px" p={4}>
              <AlertIcon color="blue.500" />
              <VStack spacing={2} align="start" flex={1}>
                <Text fontWeight="semibold" color="blue.800">
                  ☁️ Cloud Storage Setup
                </Text>
                <Text fontSize="sm" color="blue.700" lineHeight="1.5">
                  AWS S3 is not configured. Videos will be saved locally only. Set up AWS credentials to enable cloud storage, sharing, and
                  AI ticket generation.
                </Text>
              </VStack>
            </Alert>
          </Box>
        )}

        {/* Video Collection Section */}
        <Box w="full" pt={12}>
          <VStack spacing={8} align="center">
            {/* Section Header */}
            <VStack spacing={4}>
              <Heading
                py={6}
                fontSize={{ base: "2xl", sm: "3xl", md: "4xl" }}
                textAlign="center"
                fontFamily="'CS Gordon', 'Arial Black', 'Helvetica Neue', Arial, sans-serif"
                bgGradient="linear(to-r, purple.600, pink.600)"
                bgClip="text"
                fontWeight="bold">
                🎬 Uploaded Videos
              </Heading>
            </VStack>

            {/* Loading state for S3 videos */}
            {listState.isLoading && (
              <VStack spacing={3}>
                <Box
                  w={8}
                  h={8}
                  borderRadius="full"
                  border="2px solid"
                  borderColor="purple.200"
                  borderTopColor="purple.500"
                  animation="spin 1s linear infinite"
                />
                <Text textAlign="center" color="gray.500" fontSize="sm">
                  Loading videos from cloud storage...
                </Text>
              </VStack>
            )}

            {/* Error state for S3 videos */}
            {listState.error && isS3ListConfigured && (
              <Alert status="warning" borderRadius="lg" maxW="600px" bg="orange.50" borderColor="orange.200">
                <AlertIcon color="orange.500" />
                <Text color="orange.700">{listState.error}</Text>
              </Alert>
            )}

            {/* Empty State */}
            {allVideos.length === 0 && !listState.isLoading && (
              <VStack spacing={6} py={12}>
                <Box p={12} bg="gray.50" borderRadius="2xl" borderWidth="2px" borderColor="gray.200" borderStyle="dashed" maxW="500px">
                  <VStack spacing={4}>
                    <Text fontSize="6xl" opacity={0.5}>
                      🎬
                    </Text>
                    <VStack spacing={2}>
                      <Text fontSize="xl" fontWeight="bold" color="gray.600">
                        No videos yet
                      </Text>
                      <Text fontSize="md" color="gray.500" textAlign="center" lineHeight="1.6">
                        Create your first video by recording your screen or uploading an existing file. Our AI will analyze it and generate
                        professional tickets.
                      </Text>
                    </VStack>
                    <Button colorScheme="purple" onClick={onOpen} size="lg" borderRadius="lg" leftIcon={<Icon as={FiVideo} />}>
                      Create Your First Video
                    </Button>
                  </VStack>
                </Box>
              </VStack>
            )}

            {/* Video Grid */}
            {allVideos.length > 0 && (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} w="full" maxW="1200px" mx="auto">
                {allVideos.map((video) => (
                  <Box
                    key={video.id}
                    bg={bgColor}
                    borderRadius="xl"
                    shadow="lg"
                    borderWidth="1px"
                    borderColor="gray.200"
                    overflow="hidden"
                    display="flex"
                    flexDirection="column"
                    _hover={{
                      transform: "translateY(-4px)",
                      shadow: "2xl",
                      borderColor: "purple.300",
                    }}
                    transition="all 0.3s ease">
                    <VStack spacing={0} align="stretch" h="full">
                      {/* Video Thumbnail */}
                      <Box
                        h="180px"
                        bg={video.thumbnailColor}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        position="relative"
                        overflow="hidden"
                        cursor={video.blob || video.s3Url ? "pointer" : "default"}
                        onClick={video.blob || video.s3Url ? () => handlePlayVideo(video) : undefined}
                        _hover={
                          video.blob || video.s3Url
                            ? {
                                transform: "scale(1.05)",
                                opacity: 0.95,
                              }
                            : {}
                        }
                        transition="all 0.3s ease"
                        role="group">
                        {video.thumbnailUrl ? (
                          <Image
                            src={video.thumbnailUrl}
                            alt={`Thumbnail for ${video.title}`}
                            w="100%"
                            h="100%"
                            objectFit="cover"
                            borderRadius="md"
                          />
                        ) : (
                          <Icon as={FiVideo} w={12} h={12} color={video.thumbnailIconColor} />
                        )}

                        {/* Duration Badge */}
                        <Box
                          position="absolute"
                          bottom={3}
                          right={3}
                          bg="blackAlpha.800"
                          color="white"
                          px={2}
                          py={1}
                          borderRadius="md"
                          fontSize="xs"
                          fontWeight="semibold">
                          {video.duration}
                        </Box>

                        {/* Status Badges */}
                        <HStack position="absolute" top={3} left={3} spacing={2}>
                          {video.blob && (
                            <Box bg="green.500" color="white" px={2} py={1} borderRadius="md" fontSize="xs" fontWeight="bold">
                              NEW
                            </Box>
                          )}
                          {video.s3Url && (
                            <Box bg="blue.500" color="white" p={1} borderRadius="md">
                              <Icon as={FiCloud} w={3} h={3} />
                            </Box>
                          )}
                          {video.isUploading && (
                            <Box bg="blue.500" color="white" px={2} py={1} borderRadius="md" fontSize="xs" fontWeight="bold">
                              ☁️ Uploading...
                            </Box>
                          )}
                        </HStack>

                        {/* Play button overlay */}
                        {(video.blob || video.s3Url) && (
                          <Box
                            position="absolute"
                            top="50%"
                            left="50%"
                            transform="translate(-50%, -50%)"
                            bg="blackAlpha.800"
                            borderRadius="full"
                            p={4}
                            opacity={0}
                            _groupHover={{ opacity: 1 }}
                            transition="opacity 0.3s ease"
                            pointerEvents="none">
                            <Icon as={FiPlay} color="white" w={8} h={8} />
                          </Box>
                        )}
                      </Box>

                      {/* Card Content - Top Section */}
                      <VStack spacing={3} p={6} pb={3} align="stretch">
                        {/* Title and Description */}
                        <VStack spacing={2} align="start">
                          <Text fontWeight="bold" fontSize="lg" textAlign="left" color="gray.800" noOfLines={2}>
                            {video.title}
                          </Text>
                          <Text color="gray.600" fontSize="sm" textAlign="left" noOfLines={2} lineHeight="1.4">
                            {video.description}
                          </Text>
                          {/* Timestamp */}
                          <Text color="gray.500" fontSize="xs" textAlign="left" fontWeight="medium">
                            📅 Created on {new Date(video.createdAt).toLocaleDateString()} at{" "}
                            {new Date(video.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </Text>
                        </VStack>

                        {/* Progress Indicators */}
                        {video.isUploading && (
                          <Box w="full" p={3} bg="blue.50" borderRadius="lg">
                            <VStack spacing={2}>
                              <HStack justify="space-between" w="full">
                                <Text fontSize="xs" color="blue.700" fontWeight="medium">
                                  Uploading to cloud storage...
                                </Text>
                                <Text fontSize="xs" color="blue.600">
                                  {video.uploadProgress || 0}%
                                </Text>
                              </HStack>
                              <Progress value={video.uploadProgress || 0} size="sm" colorScheme="blue" borderRadius="full" bg="blue.100" />
                            </VStack>
                          </Box>
                        )}

                        {analyzingVideos.has(video.id) && (
                          <Box w="full" p={3} bg="purple.50" borderRadius="lg">
                            <VStack spacing={2}>
                              <Text fontSize="xs" color="purple.700" fontWeight="medium">
                                🤖 AI analyzing video and generating ticket...
                              </Text>
                              <Progress isIndeterminate size="sm" colorScheme="purple" borderRadius="full" bg="purple.100" />
                            </VStack>
                          </Box>
                        )}
                      </VStack>

                      {/* Bottom Section - Actions */}
                      <VStack spacing={0} mt="auto">
                        {/* Action Buttons */}
                        <Box px={6} pb={6} w="full">
                          <VStack spacing={3}>
                            {/* Primary Actions */}
                            <HStack spacing={2} w="full" justify="space-between">
                              <Button
                                size="sm"
                                flex={1}
                                onClick={() => {
                                  const ticket = videoTickets[video.id];
                                  if (ticket) {
                                    setSelectedTicket(ticket);

                                    // Open video player modal (side-by-side layout)
                                    setVideoToPlay(video);
                                    onVideoPlayerOpen();
                                  } else if (video.s3Url && !analyzingVideos.has(video.id)) {
                                    analyzeVideoAndStoreTicket(video.id, video.s3Url, video.title);
                                  } else {
                                    toast({
                                      title: "Video Not Ready",
                                      description: "This video needs to be uploaded to cloud storage first.",
                                      status: "warning",
                                      duration: 3000,
                                      isClosable: true,
                                    });
                                  }
                                }}
                                isLoading={analyzingVideos.has(video.id)}
                                loadingText="Generating..."
                                isDisabled={!video.s3Url}
                                bgGradient={
                                  videoTickets[video.id] ? "linear(to-r, green.500, green.600)" : "linear(to-r, purple.500, pink.500)"
                                }
                                color="white"
                                _hover={{
                                  bgGradient: videoTickets[video.id]
                                    ? "linear(to-r, green.600, green.700)"
                                    : "linear(to-r, purple.600, pink.600)",
                                  transform: "translateY(-1px)",
                                }}
                                _disabled={{
                                  bgGradient: "linear(to-r, gray.300, gray.400)",
                                  color: "gray.500",
                                }}
                                borderRadius="lg"
                                fontWeight="bold"
                                shadow="md">
                                {videoTickets[video.id] ? "📋 VIEW TICKET" : "✨ 🧚 GENERATE TICKET ✨"}
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="red"
                                variant="outline"
                                onClick={() => handleDeleteVideo(video)}
                                title="Delete video"
                                borderRadius="lg">
                                <Icon as={FiTrash2} />
                              </Button>
                            </HStack>
                          </VStack>
                        </Box>
                      </VStack>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </VStack>
        </Box>
      </VStack>

      {/* Video Upload Modal - Enhanced */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <ModalContent mx={4} bg="white" borderRadius="xl" shadow="2xl">
          <ModalHeader pb={2}>
            <VStack spacing={2} align="center">
              <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                ✨ Create Your Video ✨
              </Text>
              <Text fontSize="md" color="gray.600" textAlign="center" fontWeight="normal">
                Choose how you'd like to create your video for ticket generation
              </Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody px={8} pb={8}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
              {/* Upload Option */}
              <Box
                p={6}
                borderWidth="2px"
                borderColor="purple.200"
                borderRadius="xl"
                bg="purple.50"
                _hover={{
                  borderColor: "purple.300",
                  bg: "purple.100",
                  transform: "translateY(-2px)",
                  shadow: "lg",
                }}
                transition="all 0.2s"
                cursor="pointer"
                onClick={handleUploadClick}>
                <VStack spacing={4} align="center" h="full">
                  <Box p={4} bg="purple.500" borderRadius="full" color="white">
                    <Icon as={FiUpload} w={8} h={8} />
                  </Box>
                  <VStack spacing={2} textAlign="center">
                    <Text fontSize="xl" fontWeight="bold" color="purple.700">
                      Upload Video
                    </Text>
                    <Text fontSize="sm" color="gray.600" lineHeight="1.4">
                      Upload an existing video file from your device. Perfect for pre-recorded demos or screen captures.
                    </Text>
                  </VStack>
                  <Button
                    colorScheme="purple"
                    variant="solid"
                    size="md"
                    w="full"
                    onClick={handleUploadClick}
                    _hover={{ transform: "none" }}>
                    Choose File
                  </Button>
                </VStack>
              </Box>

              {/* Record Option */}
              <Box
                p={6}
                borderWidth="2px"
                borderColor="green.200"
                borderRadius="xl"
                bg="green.50"
                _hover={{
                  borderColor: "green.300",
                  bg: "green.100",
                  transform: "translateY(-2px)",
                  shadow: "lg",
                }}
                transition="all 0.2s"
                cursor="pointer"
                onClick={handleRecordClick}>
                <VStack spacing={4} align="center" h="full">
                  <Box p={4} bg="green.500" borderRadius="full" color="white">
                    <Icon as={FiCamera} w={8} h={8} />
                  </Box>
                  <VStack spacing={2} textAlign="center">
                    <Text fontSize="xl" fontWeight="bold" color="green.700">
                      Record New Video
                    </Text>
                    <Text fontSize="sm" color="gray.600" lineHeight="1.4">
                      Record your screen with webcam overlay. Great for live demos, bug reports, and feature explanations.
                    </Text>
                  </VStack>
                  <Button
                    colorScheme="green"
                    variant="solid"
                    size="md"
                    w="full"
                    onClick={handleRecordClick}
                    isLoading={state.isPreparing}
                    loadingText="Starting..."
                    _hover={{ transform: "none" }}>
                    Start Recording
                  </Button>
                </VStack>
              </Box>
            </SimpleGrid>

            {/* Additional Info */}
            <Box mt={6} p={4} bg="blue.50" borderRadius="lg" borderWidth="1px" borderColor="blue.200">
              <VStack spacing={2} align="start">
                <Text fontSize="sm" fontWeight="semibold" color="blue.700">
                  💡 Pro Tips:
                </Text>
                <VStack spacing={1} align="start" fontSize="xs" color="blue.600">
                  <Text>• Videos are automatically uploaded to cloud storage</Text>
                  <Text>• AI will analyze your video to generate detailed tickets</Text>
                  <Text>• Add notes to videos for better ticket generation</Text>
                  <Text>• Supported formats: MP4, WebM, MOV, AVI</Text>
                </VStack>
              </VStack>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Hidden file input */}
      <Input type="file" accept="video/*" ref={fileInputRef} onChange={handleFileSelect} display="none" />

      {/* Recording Modal */}
      <RecordingModal
        isOpen={isRecordingModalOpen}
        onClose={handleRecordingModalClose}
        onStartRecording={startRecording}
        onRequestPermissions={requestPermissions}
        error={state.error}
        isPreparing={state.isPreparing}
      />

      {/* Floating Recording Controls */}
      <FloatingRecordingControls isRecording={state.isRecording} recordingTime={state.recordingTime} onStop={handleStopRecording} />

      {/* Draggable Webcam Overlay */}
      <DraggableWebcamOverlay
        webcamStream={streams.webcamStream}
        isVisible={streams.webcamStream !== null}
        isRecording={state.isRecording}
        isCountingDown={state.isCountingDown}
        countdown={state.countdown}
        onStop={handleStopRecording}
      />

      {/* Recording Indicator */}
      <RecordingIndicator isRecording={state.isRecording} recordingTime={state.recordingTime} />

      {/* Video Preview Modal */}
      <VideoPreviewModal
        isOpen={isVideoPreviewOpen}
        onClose={onVideoPreviewClose}
        videoBlob={recordedVideo}
        onSaveToVideos={handleSaveToVideos}
        onConvertToTicket={handleConvertToTicket}
        onRetake={handleRetakeRecording}
      />

      {/* Permissions Popup */}
      <PermissionsPopup
        isOpen={state.showPermissionsPopup}
        onClose={() => {
          hidePermissionsPopup();
          cleanup();
        }}
        onStartRecording={requestScreenAndStart}
      />

      {/* Ready to Record Modal */}
      <ReadyToRecordModal
        isOpen={state.showReadyModal}
        // onClose={() => {
        //     // If closed, reset everything
        //     cleanup();
        // }}
        onStartRecording={startCountdownAndRecord}
      />

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Video</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>Are you sure you want to delete "{videoToDelete?.title}"?</Text>
              {videoToDelete?.s3Key && (
                <Alert status="warning" size="sm">
                  <AlertIcon />
                  <Text fontSize="sm">This video is stored in cloud storage and will be permanently deleted.</Text>
                </Alert>
              )}
              <Text fontSize="sm" color="gray.600">
                This action cannot be undone.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteModalClose} isDisabled={isDeleting}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmDeleteVideo} isLoading={isDeleting} loadingText="Deleting...">
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Video Player Modal */}
      <VideoPlayerModal
        isOpen={isVideoPlayerOpen}
        onClose={onVideoPlayerClose}
        videoTitle={videoToPlay?.title || ""}
        videoBlob={videoToPlay?.blob}
        videoUrl={videoToPlay?.s3Url}
        showTicket={selectedTicket}
        ticketData={enhancedTicket || selectedTicket}
        onOpenTicket={() => onTicketModalOpen()}
        enhancementContext={videoToPlay?.id ? enhancementContexts[videoToPlay.id] || "" : ""}
        onEnhancementContextChange={(value) => handleEnhancementContextChange(value, videoToPlay?.id)}
        onEnhanceTicket={() => enhanceTicketWithContext(videoToPlay?.id)}
        isEnhancing={isEnhancing}
        enhancedTicket={enhancedTicket}
        onResetEnhancement={resetEnhancement}
      />

      {/* Ticket Result Modal */}
      <Modal
        isOpen={isTicketResultModalOpen}
        onClose={() => {
          onTicketResultModalClose();
          resetEnhancement();
          setHasUnsavedChanges(false);
        }}
        size="lg">
        <ModalOverlay />
        <ModalContent maxH="90vh" overflowY="auto">
          <ModalHeader>
            <Text>🎉 Generated Ticket</Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={4}>
            {selectedTicket && (
              <VStack spacing={4} align="start">
                {/* Ticket Display */}
                {selectedTicket.success && selectedTicket.ticket ? (
                  <VStack spacing={2} align="start" w="full">
                    {/* Status and Action Buttons */}
                    <HStack justify="space-between" align="center" w="full">
                      <HStack spacing={2}>
                        {enhancedTicket && (
                          <Text fontSize="xs" color="green.600" fontWeight="medium" bg="green.50" px={2} py={1} borderRadius="md">
                            ✨ Enhanced
                          </Text>
                        )}
                        {hasUnsavedChanges && (
                          <Text fontSize="xs" color="orange.600" fontWeight="medium" bg="orange.50" px={2} py={1} borderRadius="md">
                            {isSaving ? "💾 Saving..." : "⚠️ Unsaved"}
                          </Text>
                        )}
                      </HStack>
                      <HStack spacing={1}>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => {
                            const ticketToUse = enhancedTicket || selectedTicket;
                            if (ticketToUse) {
                              let copyText = "";

                              if (ticketToUse.success && ticketToUse.ticket) {
                                copyText = `Title: ${ticketToUse.ticket.title}\n\nDescription:\n${ticketToUse.ticket.description}\n\nVideo ID: ${ticketToUse.video_id}\nIndex ID: ${ticketToUse.index_id}`;
                              } else if (ticketToUse.raw_response) {
                                copyText = `Raw Analysis Result:\n${ticketToUse.raw_response}`;
                              } else {
                                copyText = "Analysis completed but no ticket data was returned.";
                              }

                              navigator.clipboard
                                .writeText(copyText)
                                .then(() => {
                                  toast({
                                    title: "Copied!",
                                    description: "Ticket content copied to clipboard",
                                    status: "success",
                                    duration: 2000,
                                    isClosable: true,
                                  });
                                })
                                .catch(() => {
                                  toast({
                                    title: "Copy Failed",
                                    description: "Could not copy to clipboard",
                                    status: "error",
                                    duration: 3000,
                                    isClosable: true,
                                  });
                                });
                            }
                          }}
                          leftIcon={<Icon as={FiCopy} w={3} h={3} />}>
                          Copy
                        </Button>
                      </HStack>
                    </HStack>

                    <Box p={3} bg="white" borderRadius="md" w="full" borderWidth="1px" borderColor="gray.200">
                      <VStack spacing={3} align="start">
                        <VStack spacing={1} align="start" w="full">
                          <Text fontWeight="semibold" color="gray.700" fontSize="sm">
                            Title
                          </Text>
                          <Input
                            value={currentTitle}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            onBlur={autoSaveChanges}
                            placeholder="Enter ticket title..."
                            borderColor="gray.300"
                            _focus={{
                              borderColor: "blue.500",
                              boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
                            }}
                            fontSize="sm"
                            size="sm"
                            bg="white"
                          />
                        </VStack>

                        <VStack spacing={1} align="start" w="full">
                          <Text fontWeight="semibold" color="gray.700" fontSize="sm" mb={2}>
                            Description
                          </Text>
                          <Textarea
                            value={currentDescription}
                            onChange={(e) => handleDescriptionChange(e.target.value)}
                            onBlur={autoSaveChanges}
                            placeholder="Enter ticket description..."
                            borderColor="gray.300"
                            _focus={{
                              borderColor: "blue.500",
                              boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
                            }}
                            resize="vertical"
                            minH="120px"
                            fontSize="sm"
                            bg="white"
                            fontFamily="mono"
                          />
                        </VStack>
                      </VStack>
                    </Box>
                    <Text fontSize="sm" color="gray.500">
                      Video ID: {selectedTicket.video_id} | Index ID: {selectedTicket.index_id}
                    </Text>
                  </VStack>
                ) : selectedTicket.raw_response ? (
                  <VStack spacing={3} align="start" w="full">
                    <Text fontSize="lg" fontWeight="bold">
                      Raw Analysis Result:
                    </Text>
                    <Code p={4} w="full" whiteSpace="pre-wrap" fontSize="sm">
                      {selectedTicket.raw_response}
                    </Code>
                  </VStack>
                ) : (
                  <Alert status="warning">
                    <AlertIcon />
                    Analysis completed but no ticket data was returned.
                  </Alert>
                )}

                {/* AI Enhancement Form - Now below title and description */}
                <Box w="full" p={3} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
                  <VStack spacing={3} align="start">
                    <HStack justify="space-between" w="full">
                      <Text fontWeight="semibold" color="blue.700" fontSize="sm">
                        🤖 AI Enhancement
                      </Text>
                      <Button
                        colorScheme="blue"
                        onClick={() => enhanceTicketWithContext()}
                        isLoading={isEnhancing}
                        loadingText="Enhancing..."
                        isDisabled={!enhancementContexts[selectedTicket?.video_id || ""]?.trim()}
                        size="xs">
                        Enhance
                      </Button>
                    </HStack>
                    <Textarea
                      placeholder="Add context to improve this ticket..."
                      value={enhancementContexts[selectedTicket?.video_id || ""] || ""}
                      onChange={(e) => handleEnhancementContextChange(e.target.value, selectedTicket?.video_id)}
                      resize="vertical"
                      minH="60px"
                      bg="white"
                      borderColor="blue.300"
                      fontSize="sm"
                      _focus={{
                        borderColor: "blue.500",
                        boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
                      }}
                    />
                    {enhancedTicket && (
                      <Button variant="ghost" colorScheme="gray" onClick={() => resetEnhancement(selectedTicket?.video_id)} size="xs">
                        Reset to Original
                      </Button>
                    )}
                  </VStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter py={3}>
            <HStack spacing={2} w="full" justify="center">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const ticketToUse = enhancedTicket || selectedTicket;
                  if (ticketToUse && ticketToUse.success && ticketToUse.ticket) {
                    try {
                      const response = await fetch("http://localhost:4000/create-jira-ticket", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          title: ticketToUse.ticket.title,
                          description: ticketToUse.ticket.description,
                        }),
                      });

                      const result = await response.json();

                      if (result.self) {
                        toast({
                          title: "Jira Ticket Created!",
                          description: `Ticket ${result.key} created successfully`,
                          status: "success",
                          duration: 5000,
                          isClosable: true,
                        });

                        window.open(result.self, "_blank");
                      } else {
                        toast({
                          title: "Failed to Create Jira Ticket",
                          description: result.error || "Unknown error occurred",
                          status: "error",
                          duration: 5000,
                          isClosable: true,
                        });
                      }
                    } catch (error) {
                      console.error("Jira API error:", error);
                      toast({
                        title: "Error",
                        description: "Failed to connect to Jira API",
                        status: "error",
                        duration: 5000,
                        isClosable: true,
                      });
                    }
                  }
                }}>
                Jira
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  if (selectedTicket && selectedTicket.success && selectedTicket.ticket) {
                    try {
                      const response = await fetch("http://localhost:4000/create-linear-issue", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          title: selectedTicket.ticket.title,
                          description: selectedTicket.ticket.description,
                        }),
                      });

                      const result = await response.json();

                      if (result.success && result.url) {
                        toast({
                          title: "Linear Issue Created!",
                          description: `Issue ${result.identifier} created successfully`,
                          status: "success",
                          duration: 5000,
                          isClosable: true,
                        });

                        window.open(result.url, "_blank");
                      } else {
                        toast({
                          title: "Failed to Create Linear Issue",
                          description: result.error || "Unknown error occurred",
                          status: "error",
                          duration: 5000,
                          isClosable: true,
                        });
                      }
                    } catch (error) {
                      console.error("Linear API error:", error);
                      toast({
                        title: "Error",
                        description: "Failed to connect to Linear API",
                        status: "error",
                        duration: 5000,
                        isClosable: true,
                      });
                    }
                  }
                }}>
                Linear
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const ticketToUse = enhancedTicket || selectedTicket;
                  if (ticketToUse && ticketToUse.success && ticketToUse.ticket) {
                    onGitHubIssueModalOpen();
                  }
                }}
                isDisabled={!selectedTicket?.success || !selectedTicket?.ticket}>
                GitHub
              </Button>
              <Button size="sm" colorScheme="purple" onClick={onTicketResultModalClose}>
                Done
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Claude Agent Modal */}
      <ClaudeAgentModal
        isOpen={isClaudeAgentModalOpen}
        onClose={onClaudeAgentModalClose}
        ticketData={
          selectedTicket?.success && selectedTicket?.ticket
            ? {
                title: selectedTicket.ticket.title,
                description: selectedTicket.ticket.description,
              }
            : null
        }
      />

      {/* GitHub Issue Modal */}
      <GitHubIssueModal
        isOpen={isGitHubIssueModalOpen}
        onClose={onGitHubIssueModalClose}
        ticketTitle={(enhancedTicket || selectedTicket)?.ticket?.title || ""}
        ticketDescription={(enhancedTicket || selectedTicket)?.ticket?.description || ""}
      />
    </Box>
  );
}

export default VideoPage;
