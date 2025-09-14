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
  Button,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  Code,
} from "@chakra-ui/react";
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize2 } from "react-icons/fi";
import { useState, useRef, useEffect, useCallback } from "react";

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  videoBlob?: Blob;
  videoUrl?: string;
  showTicket?: boolean;
  ticketData?: any;
  onOpenTicket?: () => void;
  enhancementContext?: string;
  onEnhancementContextChange?: (value: string) => void;
  onEnhanceTicket?: () => void;
  isEnhancing?: boolean;
  enhancedTicket?: any;
  onResetEnhancement?: () => void;
}

export const VideoPlayerModal = ({ 
  isOpen, 
  onClose, 
  videoTitle, 
  videoBlob, 
  videoUrl, 
  showTicket, 
  ticketData, 
  onOpenTicket,
  enhancementContext,
  onEnhancementContextChange,
  onEnhanceTicket,
  isEnhancing,
  enhancedTicket,
  onResetEnhancement
}: VideoPlayerModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [, setIsFullscreen] = useState(false);
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


  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered>
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg={bgColor} maxW="95vw" maxH="95vh">
        <ModalHeader>
          <HStack justify="space-between" w="full">
            <Text>{videoTitle}</Text>
            {showTicket && ticketData && onOpenTicket && (
              <Button size="sm" colorScheme="purple" onClick={onOpenTicket}>
                View Full Ticket
              </Button>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {showTicket && ticketData ? (
            <HStack spacing={6} align="start" h="70vh">
              {/* Left Side - Video Player */}
              <Box flex="1" minW="400px">
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
                    minH="300px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {videoSrc && (
                      <video
                        ref={videoRef}
                        src={videoSrc}
                        style={{
                          width: "100%",
                          height: "auto",
                          maxHeight: "60vh",
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

                    </VStack>
                  )}
                </VStack>
              </Box>

              {/* Right Side - Ticket Display */}
              <Box flex="1" minW="300px" maxH="70vh" overflowY="auto">
                <VStack spacing={4} align="start" w="full">
                  <Text fontSize="lg" fontWeight="bold" color="purple.600">
                    🎫 Generated Ticket
                  </Text>
                  
                  {ticketData.success && ticketData.ticket ? (
                    <VStack spacing={4} align="start" w="full">
                      {/* Title */}
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="semibold">Title</FormLabel>
                        <Input
                          value={ticketData.ticket.title}
                          readOnly
                          bg="gray.50"
                          fontSize="sm"
                        />
                      </FormControl>

                      {/* Description */}
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="semibold">Description</FormLabel>
                        <Textarea
                          value={ticketData.ticket.description}
                          readOnly
                          bg="gray.50"
                          fontSize="sm"
                          minH="200px"
                          resize="vertical"
                        />
                      </FormControl>

                      {/* AI Enhancement Section */}
                      <Box w="full" p={3} bg="purple.50" borderRadius="md" borderWidth="1px" borderColor="purple.200">
                        <VStack spacing={3} align="start">
                          <HStack justify="space-between" w="full">
                            <Text fontSize="sm" color="purple.700" fontWeight="medium">
                              🤖 AI Enhancement
                            </Text>
                            {enhancedTicket && (
                              <Text fontSize="xs" color="green.600" fontWeight="medium" bg="green.50" px={2} py={1} borderRadius="md">
                                ✨ Enhanced
                              </Text>
                            )}
                          </HStack>
                          <Textarea
                            placeholder="Add context to improve this ticket..."
                            value={enhancementContext || ""}
                            onChange={(e) => onEnhancementContextChange?.(e.target.value)}
                            resize="vertical"
                            minH="60px"
                            bg="white"
                            borderColor="purple.300"
                            fontSize="sm"
                            _focus={{
                              borderColor: "purple.500",
                              boxShadow: "0 0 0 1px var(--chakra-colors-purple-500)",
                            }}
                          />
                          <HStack spacing={2} w="full">
                            <Button
                              colorScheme="purple"
                              onClick={onEnhanceTicket}
                              isLoading={isEnhancing}
                              loadingText="Enhancing..."
                              isDisabled={!enhancementContext?.trim()}
                              size="sm"
                              flex={1}
                            >
                              Enhance
                            </Button>
                            {enhancedTicket && onResetEnhancement && (
                              <Button 
                                variant="ghost" 
                                colorScheme="gray" 
                                onClick={onResetEnhancement} 
                                size="sm"
                              >
                                Reset
                              </Button>
                            )}
                          </HStack>
                        </VStack>
                      </Box>
                    </VStack>
                  ) : ticketData.raw_response ? (
                    <Box w="full">
                      <Text fontSize="md" fontWeight="bold" mb={2}>
                        Raw Analysis Result:
                      </Text>
                      <Code p={3} w="full" whiteSpace="pre-wrap" fontSize="sm" bg="gray.50">
                        {ticketData.raw_response}
                      </Code>
                    </Box>
                  ) : (
                    <Alert status="warning">
                      <AlertIcon />
                      <Text fontSize="sm">Analysis completed but no ticket data was returned.</Text>
                    </Alert>
                  )}
                </VStack>
              </Box>
            </HStack>
          ) : (
            <VStack spacing={4} align="stretch">
              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <Text>{error}</Text>
                </Alert>
              )}

              {/* Video Player - Full Width */}
              <Box
                position="relative"
                bg="black"
                borderRadius="md"
                overflow="hidden"
                minH="400px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
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

                </VStack>
              )}
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};