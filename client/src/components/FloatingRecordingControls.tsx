import {
  Box,
  Button,
  Flex,
  Text,
  Icon,
  useColorModeValue,
  Portal
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiSquare, FiPause, FiPlay } from "react-icons/fi";
import { useState } from "react";

interface FloatingRecordingControlsProps {
  isRecording: boolean;
  recordingTime: number;
  onStop: () => void;
  onPause?: () => void;
  onResume?: () => void;
  isPaused?: boolean;
}

const pulseAnimation = keyframes`
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
`;

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
};

export function FloatingRecordingControls({
  isRecording,
  recordingTime,
  onStop,
  onPause,
  onResume,
  isPaused = false
}: FloatingRecordingControlsProps) {
  const [position] = useState({ x: 20, y: 20 });

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const shadowColor = useColorModeValue("rgba(0,0,0,0.1)", "rgba(0,0,0,0.3)");

  if (!isRecording) {
    return null;
  }

  return (
    <Portal>
      <Box
        position="fixed"
        left={`${position.x}px`}
        top={`${position.y}px`}
        zIndex={10000}
        bg={bgColor}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="full"
        boxShadow={`0 4px 12px ${shadowColor}`}
        px={4}
        py={2}
        userSelect="none"
      >
        <Flex align="center" gap={3}>
          {/* Recording Indicator */}
          <Flex align="center" gap={2}>
            <Box
              width="12px"
              height="12px"
              bg={isPaused ? "orange.500" : "red.500"}
              borderRadius="50%"
              animation={isPaused ? undefined : `${pulseAnimation} 2s infinite`}
            />
            <Text
              fontSize="sm"
              fontWeight="bold"
              color={isPaused ? "orange.500" : "red.500"}
            >
              {isPaused ? "PAUSED" : "REC"}
            </Text>
          </Flex>

          {/* Timer */}
          <Text
            fontSize="sm"
            fontWeight="mono"
            fontFamily="'Courier New', monospace"
            minWidth="60px"
            textAlign="left"
          >
            {formatTime(recordingTime)}
          </Text>

          {/* Controls */}
          <Flex gap={2}>
            {/* Pause/Resume Button (optional) */}
            {(onPause || onResume) && (
              <Button
                size="sm"
                variant="ghost"
                colorScheme={isPaused ? "green" : "orange"}
                onClick={isPaused ? onResume : onPause}
                leftIcon={<Icon as={isPaused ? FiPlay : FiPause} />}
                isDisabled={isPaused && !onResume}
              >
                {isPaused ? "Resume" : "Pause"}
              </Button>
            )}

            {/* Stop Button */}
            <Button
              size="sm"
              colorScheme="red"
              onClick={onStop}
              leftIcon={<Icon as={FiSquare} />}
              _hover={{
                bg: "red.600",
                transform: "scale(1.05)"
              }}
            >
              Stop
            </Button>
          </Flex>
        </Flex>
      </Box>
    </Portal>
  );
}