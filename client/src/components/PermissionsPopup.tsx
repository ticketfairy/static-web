import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Switch,
  Icon,
  IconButton,
  useColorModeValue,
  Divider,
} from "@chakra-ui/react";
import { FiX, FiMonitor, FiMic, FiSettings, FiFilter, FiMoreHorizontal } from "react-icons/fi";
import { useState } from "react";

interface PermissionsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRecording: () => void;
}

export function PermissionsPopup({ isOpen, onClose, onStartRecording }: PermissionsPopupProps) {
  const [micEnabled, setMicEnabled] = useState(true);

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const selectedBg = useColorModeValue("blue.50", "blue.900");
  const selectedBorder = useColorModeValue("blue.500", "blue.400");
  const switchTrackColor = useColorModeValue("gray.300", "gray.600");

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top="20px"
      left="20px"
      width="320px"
      bg={bgColor}
      borderRadius="xl"
      boxShadow="0 10px 40px rgba(0,0,0,0.15)"
      border="1px solid"
      borderColor={borderColor}
      zIndex={10000}
      overflow="hidden"
    >
      <VStack spacing={0} align="stretch">
        {/* Header */}
        <HStack justify="space-between" p={4} pb={3}>
          <IconButton
            aria-label="Close"
            icon={<Icon as={FiX} />}
            size="sm"
            variant="ghost"
            onClick={onClose}
            borderRadius="full"
          />
          <HStack spacing={2}>
            <IconButton
              aria-label="Monitor"
              icon={<Icon as={FiMonitor} />}
              size="sm"
              variant="ghost"
              borderRadius="md"
              bg={selectedBg}
              border="1px solid"
              borderColor={selectedBorder}
            />
            <IconButton
              aria-label="Camera"
              icon={<Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 3l-2 4H10L8 3"></path>
              </Box>}
              size="sm"
              variant="ghost"
              borderRadius="md"
            />
            <IconButton
              aria-label="Home"
              icon={<Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </Box>}
              size="sm"
              variant="ghost"
              borderRadius="md"
            />
          </HStack>
        </HStack>

        {/* Window Selection */}
        <Box px={4} pb={3}>
          <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.600">
            Window
          </Text>
          <Box
            bg={selectedBg}
            border="2px solid"
            borderColor={selectedBorder}
            borderRadius="lg"
            p={3}
            cursor="pointer"
            _hover={{ bg: hoverBg }}
          >
            <HStack justify="space-between">
              <HStack spacing={3}>
                <Icon as={FiMonitor} color={selectedBorder} />
                <Text fontWeight="medium" fontSize="sm">
                  MacBook Air Camera
                </Text>
              </HStack>
              <Box
                bg="green.500"
                color="white"
                px={2}
                py={0.5}
                borderRadius="full"
                fontSize="xs"
                fontWeight="bold"
              >
                On
              </Box>
            </HStack>
          </Box>
        </Box>

        {/* Microphone Toggle */}
        <Box px={4} pb={4}>
          <HStack justify="space-between" p={3} bg={hoverBg} borderRadius="lg">
            <HStack spacing={3}>
              <Icon as={FiMic} />
              <Text fontSize="sm" fontWeight="medium">
                No microphone
              </Text>
            </HStack>
            <Switch
              size="md"
              isChecked={micEnabled}
              onChange={(e) => setMicEnabled(e.target.checked)}
              sx={{
                "span.chakra-switch__track": {
                  bg: micEnabled ? "green.500" : switchTrackColor,
                },
              }}
            />
          </HStack>
        </Box>

        {/* Start Recording Button */}
        <Box px={4} pb={4}>
          <Button
            width="full"
            size="lg"
            bg="orange.500"
            color="white"
            _hover={{ bg: "orange.600" }}
            _active={{ bg: "orange.700" }}
            fontWeight="bold"
            onClick={onStartRecording}
            borderRadius="lg"
          >
            Start Recording
          </Button>
        </Box>

        {/* Recording Limit */}
        <Text fontSize="xs" color="gray.500" textAlign="center" px={4} pb={3}>
          5 min recording limit
        </Text>

        <Divider />

        {/* Bottom Options */}
        <HStack justify="center" p={3} spacing={6}>
          <HStack spacing={1} cursor="pointer" _hover={{ color: "blue.500" }}>
            <Icon as={FiSettings} size="sm" />
            <Text fontSize="xs">Effects</Text>
          </HStack>
          <HStack spacing={1} cursor="pointer" _hover={{ color: "blue.500" }}>
            <Icon as={FiFilter} size="sm" />
            <Text fontSize="xs">Blur</Text>
          </HStack>
          <HStack spacing={1} cursor="pointer" _hover={{ color: "blue.500" }}>
            <Icon as={FiMoreHorizontal} size="sm" />
            <Text fontSize="xs">More</Text>
          </HStack>
        </HStack>
      </VStack>
    </Box>
  );
}