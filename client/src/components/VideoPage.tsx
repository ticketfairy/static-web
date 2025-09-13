import { Box, Button, VStack, Heading, useColorModeValue, Icon, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, Input, useToast, Text, SimpleGrid, Flex, Textarea } from "@chakra-ui/react";
import { FiVideo, FiUpload, FiCamera, FiArrowLeft } from "react-icons/fi";
import { useState, useRef } from "react";
import { useScreenRecording } from "../hooks/useScreenRecording";
import { RecordingModal } from "./RecordingModal";
import { FloatingRecordingControls } from "./FloatingRecordingControls";
import { DraggableWebcamOverlay } from "./DraggableWebcamOverlay";
import { VideoPreviewModal } from "./VideoPreviewModal";
import { RecordingIndicator } from "./RecordingIndicator";
import { TicketConversionModal } from "./TicketConversionModal";
import { useSaveToVideos } from "./SaveToVideosButton";
import { downloadBlob, generateRecordingFilename, checkBrowserSupport, getBrowserInfo } from "../utils/recordingHelpers";

interface VideoPageProps {
  onNavigateToTickets: () => void;
  onNavigateToLanding?: () => void;
}

function VideoPage({ onNavigateToTickets: _onNavigateToTickets, onNavigateToLanding }: VideoPageProps) {
  const bgColor = useColorModeValue("white", "gray.900");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isRecordingModalOpen,
    onOpen: onRecordingModalOpen,
    onClose: onRecordingModalClose
  } = useDisclosure();
  const {
    isOpen: isVideoPreviewOpen,
    onOpen: onVideoPreviewOpen,
    onClose: onVideoPreviewClose
  } = useDisclosure();
  const {
    isOpen: isTicketModalOpen,
    onOpen: onTicketModalOpen,
    onClose: onTicketModalClose
  } = useDisclosure();

  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);

  // Dynamic video collection state
  interface VideoItem {
    id: string;
    title: string;
    description: string;
    duration: string;
    thumbnailColor: string;
    thumbnailIconColor: string;
    notes: string;
    blob?: Blob;
    createdAt: Date;
  }

  const [videos, setVideos] = useState<VideoItem[]>([
    {
      id: "sample-1",
      title: "Fix Login Bug",
      description: "Screen recording showing authentication issue reproduction and debugging steps",
      duration: "2:34",
      thumbnailColor: "purple.100",
      thumbnailIconColor: "purple.500",
      notes: "",
      createdAt: new Date(Date.now() - 86400000) // 1 day ago
    },
    {
      id: "sample-2",
      title: "New Dashboard Feature",
      description: "Walkthrough of implementing user analytics dashboard with real-time data",
      duration: "4:12",
      thumbnailColor: "blue.100",
      thumbnailIconColor: "blue.500",
      notes: "",
      createdAt: new Date(Date.now() - 172800000) // 2 days ago
    },
    {
      id: "sample-3",
      title: "Database Migration",
      description: "Step-by-step database schema update and data migration process",
      duration: "6:45",
      thumbnailColor: "green.100",
      thumbnailIconColor: "green.500",
      notes: "",
      createdAt: new Date(Date.now() - 259200000) // 3 days ago
    }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const { saveToVideos } = useSaveToVideos();

  // Helper function to generate video duration from blob
  const getVideoDuration = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(blob);
      video.src = url;
      video.onloadedmetadata = () => {
        const duration = video.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        URL.revokeObjectURL(url);
        resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      };
      // Fallback if metadata doesn't load
      setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve("0:00");
      }, 3000);
    });
  };

  // Helper function to add new video to collection
  const addVideoToCollection = async (blob: Blob, title?: string) => {
    const duration = await getVideoDuration(blob);
    const timestamp = new Date();

    // Format timestamp as requested: "MM/DD/YYYY HH:MM:SS"
    const formattedTimestamp = `${(timestamp.getMonth() + 1).toString().padStart(2, '0')}/${timestamp.getDate().toString().padStart(2, '0')}/${timestamp.getFullYear()} ${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}:${timestamp.getSeconds().toString().padStart(2, '0')}`;

    const newVideo: VideoItem = {
      id: `video-${timestamp.getTime()}`,
      title: title || formattedTimestamp,
      description: "Screen recording with webcam",
      duration,
      thumbnailColor: "purple.100",
      thumbnailIconColor: "purple.500",
      notes: "",
      blob,
      createdAt: timestamp
    };

    // Add to the beginning of the videos array (most recent first)
    setVideos(prev => [newVideo, ...prev]);

    return newVideo;
  };

  // Helper function to update video notes
  const updateVideoNotes = (videoId: string, notes: string) => {
    setVideos(prev => prev.map(video =>
      video.id === videoId ? { ...video, notes } : video
    ));
  };

  const {
    state,
    streams,
    startRecording,
    stopRecording,
    requestPermissions,
    requestWebcamOnly,
    startCountdownAndRecord,
    cleanup
  } = useScreenRecording();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      console.log('File selected:', file.name);

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
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
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
        console.error('Failed to process uploaded video:', error);
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
        description: `Your browser is missing: ${browserSupport.missingFeatures.join(', ')}. Please use Chrome or a Chromium-based browser.`,
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

    // Request permissions for both screen and webcam, then show webcam circle
    const permissionsSuccess = await requestPermissions();
    if (permissionsSuccess) {
      // Webcam circle will appear automatically due to existing state management
      // User can then click the webcam circle to start the countdown and recording
    }
  };

  const handleStopRecording = async () => {
    try {
      const recordingBlob = await stopRecording();

      if (recordingBlob) {
        console.log('Recording blob received:', recordingBlob.size, 'bytes');
        setRecordedVideo(recordingBlob);

        // Auto-save to video collection
        toast({
          title: "Processing Recording...",
          description: "Saving your recording to the video collection",
          status: "info",
          duration: 2000,
          isClosable: true,
        });

        const newVideo = await addVideoToCollection(recordingBlob);

        toast({
          title: "Recording Saved!",
          description: `"${newVideo.title}" has been added to your video collection`,
          status: "success",
          duration: 4000,
          isClosable: true,
        });

        // Still open preview for additional options
        onVideoPreviewOpen();
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
      console.error('Failed to process recording:', error);
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

  const handleDownloadVideo = (blob: Blob) => {
    const filename = generateRecordingFilename();
    downloadBlob(blob, filename);
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
    console.log('Saving ticket:', ticketData);
    toast({
      title: "Ticket Saved",
      description: "Your AI-generated ticket has been saved to your project!",
      status: "success",
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Box bg={bgColor} minH="100vh">
      {/* Back Button */}
      {onNavigateToLanding && (
        <Box p={4}>
          <Button
            leftIcon={<Icon as={FiArrowLeft} />}
            variant="ghost"
            onClick={onNavigateToLanding}
          >
            Back to Home
          </Button>
        </Box>
      )}

      {/* Video Page Content */}
      <VStack spacing={8} textAlign="center" py={20} px={4} maxW="1200px" mx="auto">

        {!streams.webcamStream ? (
          <Button
            colorScheme="purple"
            size="xl"
            h="80px"
            px="60px"
            fontSize="2xl"
            fontWeight="bold"
            rightIcon={<Icon as={FiVideo} w={8} h={8} />}
            onClick={onOpen}
          >
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
              loadingText={state.isCountingDown ? `Starting in ${state.countdown}...` : "Preparing..."}
            >
              {state.isRecording ? "Stop Recording" : "Record"}
            </Button>

            {state.isRecording && (
              <Text fontSize="md" color="red.500" fontWeight="bold">
                🔴 Recording in progress...
              </Text>
            )}
          </VStack>
        )}

        {/* Sample Videos Section */}
        <Box w="full" pt={16}>
          <VStack spacing={8}>
            <Heading fontSize="2xl" textAlign="center">
              🦷 My <Text as="span" textDecoration="line-through">Teeth</Text> Tickets 🦷
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="full">
              {videos.map((video) => (
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
                    >
                      <Icon as={FiVideo} w={12} h={12} color={video.thumbnailIconColor} />
                      <Text
                        position="absolute"
                        bottom={2}
                        right={2}
                        bg="blackAlpha.700"
                        color="white"
                        px={2}
                        py={1}
                        borderRadius="sm"
                        fontSize="xs"
                      >
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
                          fontSize="xs"
                        >
                          NEW
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
                    </VStack>

                    <Textarea
                      placeholder="Add your notes about this video..."
                      value={video.notes}
                      onChange={(e) => updateVideoNotes(video.id, e.target.value)}
                      resize="vertical"
                      minH="100px"
                      bg="gray.50"
                    />

                    <Flex gap={2}>
                      <Button size="sm" colorScheme="purple" variant="outline" flex={1}>
                        Play
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="purple"
                        variant="ghost"
                        flex={1}
                        onClick={() => {
                          // TODO: Replace with actual backend URL when connected
                          const shareableLink = video.blob
                            ? `https://ticketfairy.app/video/${video.id}`
                            : "Link not available";

                          navigator.clipboard.writeText(shareableLink).then(() => {
                            toast({
                              title: "Link Copied!",
                              description: "Video link has been copied to clipboard",
                              status: "success",
                              duration: 2000,
                              isClosable: true,
                            });
                          }).catch(() => {
                            toast({
                              title: "Copy Failed",
                              description: "Could not copy link to clipboard",
                              status: "error",
                              duration: 3000,
                              isClosable: true,
                            });
                          });
                        }}
                        isDisabled={!video.blob}
                      >
                        Get Link
                      </Button>
                    </Flex>

                    <Button size="sm" colorScheme="purple" variant="solid" w="full">
                      ✨ 🧚 TICKET ✨
                    </Button>
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          </VStack>
        </Box>
      </VStack>

      {/* Video Upload Modal - Simplified */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={8}>
            <SimpleGrid columns={2} spacing={6} w="full">
              <Button
                h="120px"
                w="120px"
                colorScheme="purple"
                variant="outline"
                fontSize="xl"
                fontWeight="bold"
                onClick={handleUploadClick}
                display="flex"
                flexDirection="column"
                gap={3}
              >
                <Icon as={FiUpload} w={8} h={8} />
                Upload
              </Button>

              <Button
                h="120px"
                w="120px"
                colorScheme="purple"
                fontSize="xl"
                fontWeight="bold"
                onClick={handleRecordClick}
                isLoading={state.isPreparing}
                loadingText="Starting..."
                display="flex"
                flexDirection="column"
                gap={3}
              >
                <Icon as={FiCamera} w={8} h={8} />
                Record
              </Button>
            </SimpleGrid>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Hidden file input */}
      <Input
        type="file"
        accept="video/*"
        ref={fileInputRef}
        onChange={handleFileSelect}
        display="none"
      />

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
      <FloatingRecordingControls
        isRecording={state.isRecording}
        recordingTime={state.recordingTime}
        onStop={handleStopRecording}
      />

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
      <RecordingIndicator
        isRecording={state.isRecording}
        recordingTime={state.recordingTime}
      />

      {/* Video Preview Modal */}
      <VideoPreviewModal
        isOpen={isVideoPreviewOpen}
        onClose={onVideoPreviewClose}
        videoBlob={recordedVideo}
        onSaveToVideos={handleSaveToVideos}
        onDownload={handleDownloadVideo}
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
    </Box>
  );
}

export default VideoPage;