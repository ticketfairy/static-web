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
  Flex,
  Textarea,
  Progress,
  Alert,
  AlertIcon,
  Code,
} from "@chakra-ui/react";
import { FiVideo, FiUpload, FiCamera, FiArrowLeft, FiCloud, FiTrash2, FiCopy } from "react-icons/fi";
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useScreenRecording } from "../hooks/useScreenRecording";

// API function to call Flask analyze_video endpoint
const analyzeVideo = async (videoUrl: string) => {
  console.log("Calling analyze_video API with URL:", videoUrl);
  try {
    const response = await fetch("http://localhost:4000/analyze-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_url: videoUrl,
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
import { TicketConversionModal } from "./TicketConversionModal";
import { PermissionsPopup } from "./PermissionsPopup";
import { ReadyToRecordModal } from "./ReadyToRecordModal";
import { useSaveToVideos } from "./SaveToVideosButton";
import { generateRecordingFilename, checkBrowserSupport, getBrowserInfo } from "../utils/recordingHelpers";
import { useS3Upload, useS3VideoList } from "../hooks/useS3Upload";
import type { S3VideoMetadata } from "../utils/s3Upload";
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
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const { isOpen: isTicketResultModalOpen, onOpen: onTicketResultModalOpen, onClose: onTicketResultModalClose } = useDisclosure();

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

  // Helper function to convert S3 video to VideoItem format
  const convertS3VideoToVideoItem = useCallback(
    (s3Video: S3VideoMetadata): VideoItem => {
      // Extract info from S3 key (e.g., "videos/2025-09-13T19-12-46-728Z-yopjxw.webm")
      const keyParts = s3Video.key.split("/");
      const filename = keyParts[keyParts.length - 1];

      // Try to extract timestamp from filename
      let title = filename;
      let createdAt = s3Video.lastModified;

      // Generate a reasonable duration estimate based on file size (very rough)
      const estimatedDuration = Math.max(30, Math.min(600, Math.floor(s3Video.size / 100000))); // rough estimate
      const minutes = Math.floor(estimatedDuration / 60);
      const seconds = estimatedDuration % 60;
      const durationString = `${minutes}:${seconds.toString().padStart(2, "0")}`;

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
      };
    },
    [s3VideoThumbnails]
  );

  // Merge local videos with S3 videos
  const allVideos = useMemo(() => {
    const s3Videos = listState.videos.map(convertS3VideoToVideoItem);
    const localVideos = videos.filter((video) => !video.s3Key); // Only include local videos without S3 keys

    // Combine and sort by creation date (newest first)
    return [...s3Videos, ...localVideos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [listState.videos, videos, s3VideoThumbnails, convertS3VideoToVideoItem]);

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

  // Trigger S3 thumbnail generation when S3 videos are loaded
  useEffect(() => {
    if (listState.videos.length > 0 && !listState.isLoading) {
      // Small delay to allow UI to render first
      setTimeout(() => {
        generateS3Thumbnails();
      }, 1000);
    }
  }, [listState.videos, listState.isLoading, generateS3Thumbnails]);

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
  const analyzeVideoAndStoreTicket = async (videoId: string, s3Url: string) => {
    // Mark video as analyzing
    setAnalyzingVideos((prev) => new Set(prev).add(videoId));

    try {
      const result = await analyzeVideo(s3Url);
      console.log("API Result for video", videoId, ":", result);

      // Store the ticket result for this video
      setVideoTickets((prev) => ({
        ...prev,
        [videoId]: result,
      }));

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
          analyzeVideoAndStoreTicket(videoId, result.url!);
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
    const existingTitles = allVideos.map((video) => video.title);

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
  const addVideoToCollection = async (blob: Blob, title?: string) => {
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

    // Generate thumbnail for the video
    let thumbnailUrl: string | undefined;
    try {
      thumbnailUrl = await generateThumbnailFromBlob(blob, {
        width: 320,
        height: 180,
        timeOffset: 1,
      });
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

  // Helper function to update video notes
  const updateVideoNotes = (videoId: string, notes: string) => {
    setVideos((prev) => prev.map((video) => (video.id === videoId ? { ...video, notes } : video)));
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
      }

      // Remove from local videos state (for both local and S3 videos)
      setVideos((prev) => prev.filter((video) => video.id !== videoToDelete.id));

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

        const baseFilename = "Screen Recording.webm";
        const uniqueFilename = generateUniqueFilename(baseFilename);

        const newVideo = await addVideoToCollection(recordingBlob, uniqueFilename);

        toast({
          title: "Recording Saved!",
          description: `"${newVideo.title}" has been added to your video collection`,
          status: "success",
          duration: 4000,
          isClosable: true,
        });

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

  return (
    <Box bg={bgColor} minH="100vh" width="100vw" display="flex" flexDirection="column">
      {/* Back Button */}
      {onNavigateToLanding && (
        <Box p={4}>
          <Button leftIcon={<Icon as={FiArrowLeft} />} variant="ghost" onClick={onNavigateToLanding}>
            Back to Home
          </Button>
        </Box>
      )}

      {/* Video Page Content */}
      <VStack spacing={8} textAlign="center" py={20} px={4} maxW="1200px" mx="auto" flex="1" justify="flex-start" align="center">
        {!streams.webcamStream ? (
          <Button
            colorScheme="purple"
            size="xl"
            h="80px"
            px="60px"
            fontSize="2xl"
            fontWeight="bold"
            rightIcon={<Icon as={FiVideo} w={8} h={8} />}
            onClick={onOpen}>
            Create Video
          </Button>
        ) : (
          <VStack spacing={6}>
            <Text fontSize="lg" color="gray.600">
              Position your webcam, then click Record to start
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
              loadingText={state.isCountingDown ? `Starting in ${state.countdown}...` : "Preparing..."}>
              {state.isRecording ? "Stop Recording" : "Record"}
            </Button>

            {state.isRecording && (
              <Text fontSize="md" color="red.500" fontWeight="bold">
                🔴 Recording in progress...
              </Text>
            )}
          </VStack>
        )}

        {/* S3 Configuration Status */}
        {!isS3Configured && (
          <Alert status="warning" borderRadius="md" maxW="600px">
            <AlertIcon />
            <Text>AWS S3 not configured. Videos will only be saved locally. Set up AWS credentials to enable cloud storage.</Text>
          </Alert>
        )}

        {/* Sample Videos Section */}
        <Box w="full" pt={16}>
          <VStack spacing={8} align="center">
            <Heading fontSize="2xl" textAlign="center">
              🦷 My{" "}
              <Text as="span" textDecoration="line-through">
                Teeth
              </Text>{" "}
              Tickets 🦷
            </Heading>

            {/* Loading state for S3 videos */}
            {listState.isLoading && (
              <Text textAlign="center" color="gray.500">
                Loading videos from cloud storage...
              </Text>
            )}

            {/* Error state for S3 videos */}
            {listState.error && isS3ListConfigured && (
              <Alert status="warning" borderRadius="md" maxW="600px">
                <AlertIcon />
                <Text>{listState.error}</Text>
              </Alert>
            )}

            {/* Refresh button */}
            {isS3ListConfigured && (
              <Button size="sm" variant="outline" onClick={refreshVideoList} isLoading={listState.isLoading} loadingText="Refreshing...">
                Refresh Videos
              </Button>
            )}

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} w="full" maxW="1000px" mx="auto">
              {allVideos.map((video) => (
                <Box key={video.id} p={6} shadow="lg" borderWidth="1px" borderRadius="lg" bg={bgColor}>
                  <VStack spacing={4} align="stretch">
                    <Box
                      h="150px"
                      bg={video.thumbnailColor}
                      borderRadius="md"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      position="relative"
                      overflow="hidden">
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
                      <Text
                        position="absolute"
                        bottom={2}
                        right={2}
                        bg="blackAlpha.700"
                        color="white"
                        px={2}
                        py={1}
                        borderRadius="sm"
                        fontSize="xs">
                        {video.duration}
                      </Text>
                      {video.blob && (
                        <Text
                          position="absolute"
                          top={2}
                          right={2}
                          bg="green.500"
                          color="white"
                          px={1}
                          py={0.5}
                          borderRadius="sm"
                          fontSize="xs">
                          NEW
                        </Text>
                      )}
                      {video.s3Url && <Icon as={FiCloud} position="absolute" top={2} left={2} color="blue.500" w={4} h={4} />}
                      {video.isUploading && (
                        <Text
                          position="absolute"
                          top={2}
                          left={2}
                          bg="blue.500"
                          color="white"
                          px={1}
                          py={0.5}
                          borderRadius="sm"
                          fontSize="xs">
                          ☁️ Uploading...
                        </Text>
                      )}
                    </Box>

                    <VStack spacing={2} align="start">
                      <Text fontWeight="bold" fontSize="lg" textAlign="left">
                        {video.title}
                      </Text>
                      <Text color="gray.600" fontSize="sm" textAlign="left">
                        {video.description}
                      </Text>
                      {video.isUploading && (
                        <Box w="full">
                          <Text fontSize="xs" color="blue.600" mb={1}>
                            Uploading to cloud storage...
                          </Text>
                          <Progress value={video.uploadProgress || 0} size="sm" colorScheme="blue" borderRadius="md" />
                        </Box>
                      )}
                      {analyzingVideos.has(video.id) && (
                        <Box w="full">
                          <Text fontSize="xs" color="purple.600" mb={1}>
                            🤖 Analyzing video and generating ticket...
                          </Text>
                          <Progress isIndeterminate size="sm" colorScheme="purple" borderRadius="md" />
                        </Box>
                      )}
                      {video.s3Url && !video.isUploading && !analyzingVideos.has(video.id) && (
                        <Text fontSize="xs" color="blue.600">
                          ☁️ Stored in cloud
                        </Text>
                      )}
                    </VStack>

                    <Textarea
                      placeholder="Add optional notes to this video before generating a ticket..."
                      value={video.notes}
                      onChange={(e) => updateVideoNotes(video.id, e.target.value)}
                      resize="vertical"
                      minH="100px"
                      bg="gray.50"
                    />

                    <Flex gap={2}>
                      <Button
                        size="sm"
                        colorScheme="purple"
                        variant="outline"
                        flex={1}
                        onClick={() => handlePlayVideo(video)}
                        isDisabled={!video.blob && !video.s3Url}>
                        Play
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="purple"
                        variant="ghost"
                        flex={1}
                        onClick={() => {
                          // Use S3 URL if available, otherwise fallback to placeholder
                          const shareableLink =
                            video.s3Url || (video.blob ? `https://ticketfairy.app/video/${video.id}` : "Link not available");

                          navigator.clipboard
                            .writeText(shareableLink)
                            .then(() => {
                              toast({
                                title: "Link Copied!",
                                description: video.s3Url
                                  ? "S3 video link has been copied to clipboard"
                                  : "Video link has been copied to clipboard",
                                status: "success",
                                duration: 2000,
                                isClosable: true,
                              });
                            })
                            .catch(() => {
                              toast({
                                title: "Copy Failed",
                                description: "Could not copy link to clipboard",
                                status: "error",
                                duration: 3000,
                                isClosable: true,
                              });
                            });
                        }}
                        isDisabled={!video.blob && !video.s3Url}>
                        Get Link
                      </Button>
                      <Button size="sm" colorScheme="red" variant="ghost" onClick={() => handleDeleteVideo(video)} title="Delete video">
                        <Icon as={FiTrash2} />
                      </Button>
                    </Flex>

                    <Button
                      size="sm"
                      colorScheme="purple"
                      variant="solid"
                      w="full"
                      onClick={() => {
                        const ticket = videoTickets[video.id];
                        if (ticket) {
                          setSelectedTicket(ticket);
                          onTicketResultModalOpen();
                        } else if (video.s3Url && !analyzingVideos.has(video.id)) {
                          // Manually trigger analysis if not done yet
                          analyzeVideoAndStoreTicket(video.id, video.s3Url);
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
                      loadingText="Generating Ticket..."
                      isDisabled={!video.s3Url}>
                      {videoTickets[video.id] ? "📋 VIEW TICKET" : "✨ 🧚 GENERATE TICKET ✨"}
                    </Button>
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
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

      {/* Ticket Conversion Modal */}
      <TicketConversionModal
        isOpen={isTicketModalOpen}
        onClose={onTicketModalClose}
        videoBlob={recordedVideo}
        onSaveTicket={handleSaveTicket}
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
      />

      {/* Ticket Result Modal */}
      <Modal isOpen={isTicketResultModalOpen} onClose={onTicketResultModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex justify="space-between" align="center">
              <Text>🎉 Generated Ticket</Text>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (selectedTicket) {
                    let copyText = "";

                    if (selectedTicket.success && selectedTicket.ticket) {
                      copyText = `Title: ${selectedTicket.ticket.title}\n\nDescription:\n${selectedTicket.ticket.description}\n\nVideo ID: ${selectedTicket.video_id}\nIndex ID: ${selectedTicket.index_id}`;
                    } else if (selectedTicket.raw_response) {
                      copyText = `Raw Analysis Result:\n${selectedTicket.raw_response}`;
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
                leftIcon={<Icon as={FiCopy} />}
                mr={8}>
                Copy
              </Button>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTicket && (
              <VStack spacing={4} align="start">
                {selectedTicket.success && selectedTicket.ticket ? (
                  <VStack spacing={3} align="start" w="full">
                    <Box p={4} bg="gray.50" borderRadius="md" w="full">
                      <VStack spacing={3} align="start">
                        <Text fontWeight="bold" color="purple.600" fontSize="lg">
                          Title:
                        </Text>
                        <Text fontSize="md">{selectedTicket.ticket.title}</Text>
                        <Text fontWeight="bold" color="purple.600" fontSize="lg" mt={2}>
                          Description:
                        </Text>
                        <Text fontSize="md" whiteSpace="pre-wrap">
                          {selectedTicket.ticket.description}
                        </Text>
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
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => {
                // TODO: Implement Jira integration
                toast({
                  title: "Jira Integration",
                  description: "Jira integration coming soon!",
                  status: "info",
                  duration: 3000,
                  isClosable: true,
                });
              }}>
              Open in Jira
            </Button>
            <Button
              colorScheme="gray"
              mr={3}
              onClick={() => {
                // TODO: Implement Linear integration
                toast({
                  title: "Linear Integration",
                  description: "Linear integration coming soon!",
                  status: "info",
                  duration: 3000,
                  isClosable: true,
                });
              }}>
              Open in Linear
            </Button>
            <Button colorScheme="purple" onClick={onTicketResultModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default VideoPage;
