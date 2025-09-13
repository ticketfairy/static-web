import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Button,
  Box,
  useColorModeValue,
  Icon,
  Progress,
  Divider,
  useToast
} from "@chakra-ui/react";
import { FiSave, FiPlay, FiPause, FiDownload, FiRefreshCw, FiZap } from "react-icons/fi";
import { useState, useRef, useEffect } from "react";

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoBlob: Blob | null;
  onSaveToVideos: (blob: Blob) => Promise<void>;
  onDownload: (blob: Blob) => void;
  onConvertToTicket: (blob: Blob) => void;
  onRetake: () => void;
}

export function VideoPreviewModal({
  isOpen,
  onClose,
  videoBlob,
  onSaveToVideos,
  onDownload,
  onConvertToTicket,
  onRetake
}: VideoPreviewModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [hasConverted, setHasConverted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const toast = useToast();

  const borderColor = useColorModeValue("gray.200", "gray.600");

  useEffect(() => {
    if (videoBlob && videoRef.current) {
      const videoUrl = URL.createObjectURL(videoBlob);
      videoRef.current.src = videoUrl;

      return () => {
        URL.revokeObjectURL(videoUrl);
      };
    }
  }, [videoBlob]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (percentage: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = (percentage / 100) * duration;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveToVideos = async () => {
    if (!videoBlob) return;

    setIsSaving(true);
    try {
      await onSaveToVideos(videoBlob);
      toast({
        title: "Video Saved",
        description: "Your recording has been saved to your Videos folder!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save video",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!videoBlob) return;
    onDownload(videoBlob);
    toast({
      title: "Video Downloaded",
      description: "Your recording has been downloaded to your Downloads folder!",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleConvertToTicket = () => {
    if (!videoBlob) return;
    setHasConverted(true);
    onConvertToTicket(videoBlob);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent maxW="800px">
        <ModalHeader>Preview Your Recording</ModalHeader>
        <ModalCloseButton />

        <ModalBody pb={6}>
          <VStack spacing={6}>
            {/* Video Player */}
            <Box
              w="full"
              bg="black"
              borderRadius="lg"
              overflow="hidden"
              position="relative"
              border="1px solid"
              borderColor={borderColor}
            >
              <video
                ref={videoRef}
                width="100%"
                height="400"
                style={{ objectFit: 'contain' }}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />

              {/* Video Controls Overlay */}
              <Box
                position="absolute"
                bottom="0"
                left="0"
                right="0"
                bg="linear-gradient(to top, rgba(0,0,0,0.8), transparent)"
                p={4}
              >
                <VStack spacing={2}>
                  {/* Progress Bar */}
                  <Box w="full" position="relative">
                    <Progress
                      value={progressPercentage}
                      colorScheme="purple"
                      bg="rgba(255,255,255,0.3)"
                      borderRadius="full"
                      height="6px"
                      cursor="pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const percentage = (clickX / rect.width) * 100;
                        handleSeek(percentage);
                      }}
                    />
                  </Box>

                  {/* Play Controls */}
                  <HStack w="full" justify="space-between" align="center">
                    <HStack spacing={3}>
                      <Button
                        size="sm"
                        variant="ghost"
                        color="white"
                        onClick={handlePlayPause}
                        leftIcon={<Icon as={isPlaying ? FiPause : FiPlay} />}
                      >
                        {isPlaying ? 'Pause' : 'Play'}
                      </Button>

                      <Text color="white" fontSize="sm">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </Text>
                    </HStack>

                    {videoBlob && (
                      <Text color="white" fontSize="sm">
                        {(videoBlob.size / (1024 * 1024)).toFixed(1)} MB
                      </Text>
                    )}
                  </HStack>
                </VStack>
              </Box>
            </Box>

            {/* Action Buttons */}
            <VStack w="full" spacing={4}>
              {/* Save Options */}
              <VStack w="full" spacing={3}>
                <Text fontWeight="semibold" color="gray.600">
                  Save Your Recording
                </Text>

                <HStack w="full" spacing={3}>
                  <Button
                    flex={1}
                    leftIcon={<Icon as={FiSave} />}
                    colorScheme="blue"
                    onClick={handleSaveToVideos}
                    isLoading={isSaving}
                    loadingText="Saving..."
                  >
                    Save to Videos
                  </Button>

                  <Button
                    flex={1}
                    leftIcon={<Icon as={FiDownload} />}
                    variant="outline"
                    onClick={handleDownload}
                  >
                    Download
                  </Button>
                </HStack>
              </VStack>

              <Divider />

              {/* AI Processing */}
              <VStack w="full" spacing={3}>
                <Text fontWeight="semibold" color="gray.600">
                  Convert to Ticket
                </Text>

                <Button
                  w="full"
                  leftIcon={<Icon as={FiZap} />}
                  colorScheme="purple"
                  size="lg"
                  onClick={handleConvertToTicket}
                  isDisabled={hasConverted}
                >
                  {hasConverted ? 'Processing...' : 'Convert to Ticket with AI'}
                </Button>

                <Text fontSize="sm" color="gray.500" textAlign="center">
                  AI will analyze your recording and create a structured ticket
                </Text>
              </VStack>

              <Divider />

              {/* Other Options */}
              <HStack w="full" spacing={3}>
                <Button
                  flex={1}
                  leftIcon={<Icon as={FiRefreshCw} />}
                  variant="ghost"
                  onClick={onRetake}
                >
                  Record Again
                </Button>

                <Button flex={1} variant="ghost" onClick={onClose}>
                  Close
                </Button>
              </HStack>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}