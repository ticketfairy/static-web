import {
  Box,
  Text,
  HStack,
  useColorModeValue,
  Portal
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

interface RecordingIndicatorProps {
  isRecording: boolean;
  recordingTime: number;
}

const pulseAnimation = keyframes`
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
  100% { opacity: 1; transform: scale(1); }
`;

const blinkAnimation = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
`;

export function RecordingIndicator({ isRecording, recordingTime }: RecordingIndicatorProps) {
  const bgColor = useColorModeValue("white", "gray.800");
  const shadowColor = useColorModeValue("rgba(0,0,0,0.1)", "rgba(0,0,0,0.3)");

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecording) {
    return null;
  }

  return (
    <Portal>
      {/* Top-right corner indicator */}
      <Box
        position="fixed"
        top="20px"
        right="20px"
        zIndex={10001}
        bg={bgColor}
        borderRadius="full"
        px={4}
        py={2}
        boxShadow={`0 4px 12px ${shadowColor}`}
        border="2px solid"
        borderColor="red.500"
        userSelect="none"
      >
        <HStack spacing={2} align="center">
          {/* Pulsing red dot */}
          <Box
            width="12px"
            height="12px"
            bg="red.500"
            borderRadius="50%"
            animation={`${pulseAnimation} 1.5s infinite`}
          />

          {/* REC text */}
          <Text
            fontSize="sm"
            fontWeight="bold"
            color="red.500"
            animation={`${blinkAnimation} 2s infinite`}
          >
            REC
          </Text>

          {/* Timer */}
          <Text
            fontSize="sm"
            fontWeight="mono"
            fontFamily="'Comic Sans MS', cursive, 'Courier New', monospace"
            color="red.500"
            minWidth="40px"
          >
            {formatTime(recordingTime)}
          </Text>
        </HStack>
      </Box>

      {/* Screen overlay indicator */}
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        height="4px"
        bg="red.500"
        zIndex={9998}
        animation={`${blinkAnimation} 3s infinite`}
      />

      {/* Bottom indicator for extra visibility */}
      <Box
        position="fixed"
        bottom="20px"
        left="50%"
        transform="translateX(-50%)"
        zIndex={10000}
        bg="rgba(255, 0, 0, 0.9)"
        color="white"
        borderRadius="full"
        px={6}
        py={2}
        boxShadow="0 4px 12px rgba(255, 0, 0, 0.3)"
        userSelect="none"
      >
        <HStack spacing={3} align="center">
          <Box
            width="8px"
            height="8px"
            bg="white"
            borderRadius="50%"
            animation={`${pulseAnimation} 1s infinite`}
          />

          <Text fontSize="sm" fontWeight="bold">
            Recording in progress • {formatTime(recordingTime)}
          </Text>
        </HStack>
      </Box>
    </Portal>
  );
}