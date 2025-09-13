import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Text,
  VStack,
  HStack,
  IconButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useColorModeValue,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize2 } from "react-icons/fi";
import { useState, useRef, useEffect, useCallback } from "react";

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  videoBlob?: Blob;
  videoUrl?: string;
}

export const VideoPlayerModal = ({ isOpen, onClose, videoTitle, videoBlob, videoUrl }: VideoPlayerModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>("");

  const bgColor = useColorModeValue("white", "gray.800");

  // Create video source URL
  useEffect(() => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      setVideoSrc(url);
      return () => URL.revokeObjectURL(url);
    } else if (videoUrl) {
      setVideoSrc(videoUrl);
    }
  }, [videoBlob, videoUrl]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsPlaying(false);
      setCurrentTime(0);
    } else {
      // Pause video when modal closes
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isOpen]);

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.volume = volume;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleError = () => {
    setError("Failed to load video. The video file may be corrupted or in an unsupported format.");
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  // Control functions
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((err) => {
        console.error("Failed to play video:", err);
        setError("Failed to play video. Please try again.");
      });
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = (value: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value;
      setIsMuted(value === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;

    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen().catch((err) => {
        console.error("Failed to enter fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Format time for display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
          }
          break;
        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isOpen, togglePlay, duration, toggleMute, toggleFullscreen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered>
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg={bgColor} maxW="90vw" maxH="90vh">
        <ModalHeader>{videoTitle}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Text>{error}</Text>
              </Alert>
            )}

            {/* Video Player */}
            <Box
              position="relative"
              bg="black"
              borderRadius="md"
              overflow="hidden"
              minH="400px"
              display="flex"
              alignItems="center"
              justifyContent="center">
              {videoSrc && (
                <video
                  ref={videoRef}
                  src={videoSrc}
                  style={{
                    width: "100%",
                    height: "auto",
                    maxHeight: "70vh",
                  }}
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onError={handleError}
                  onEnded={handleEnded}
                  playsInline
                />
              )}

              {!videoSrc && !error && (
                <Text color="white" fontSize="lg">
                  Loading video...
                </Text>
              )}
            </Box>

            {/* Video Controls */}
            {videoSrc && !error && (
              <VStack spacing={3} align="stretch">
                {/* Progress Bar */}
                <Box px={2}>
                  <Slider value={currentTime} max={duration || 100} onChange={handleSeek} focusThumbOnChange={false}>
                    <SliderTrack bg="gray.200">
                      <SliderFilledTrack bg="purple.500" />
                    </SliderTrack>
                    <SliderThumb boxSize={4} />
                  </Slider>
                </Box>

                {/* Control Buttons and Time */}
                <HStack justify="space-between" align="center">
                  <HStack spacing={3}>
                    <IconButton
                      aria-label={isPlaying ? "Pause" : "Play"}
                      icon={isPlaying ? <FiPause /> : <FiPlay />}
                      onClick={togglePlay}
                      colorScheme="purple"
                      size="md"
                    />

                    <Text fontSize="sm" minW="80px">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </Text>
                  </HStack>

                  <HStack spacing={3} align="center">
                    {/* Volume Control */}
                    <IconButton
                      aria-label={isMuted ? "Unmute" : "Mute"}
                      icon={isMuted ? <FiVolumeX /> : <FiVolume2 />}
                      onClick={toggleMute}
                      variant="ghost"
                      size="sm"
                    />

                    <Box w="100px">
                      <Slider value={isMuted ? 0 : volume} max={1} step={0.1} onChange={handleVolumeChange} focusThumbOnChange={false}>
                        <SliderTrack bg="gray.200">
                          <SliderFilledTrack bg="purple.500" />
                        </SliderTrack>
                        <SliderThumb boxSize={3} />
                      </Slider>
                    </Box>

                    {/* Fullscreen Button */}
                    <IconButton aria-label="Fullscreen" icon={<FiMaximize2 />} onClick={toggleFullscreen} variant="ghost" size="sm" />
                  </HStack>
                </HStack>

                {/* Keyboard shortcuts hint */}
                <Text fontSize="xs" color="gray.500" textAlign="center">
                  Keyboard shortcuts: Space (play/pause), ← → (seek), M (mute), F (fullscreen)
                </Text>
              </VStack>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
