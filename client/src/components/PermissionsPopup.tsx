import { Box, Button, Divider, HStack, Icon, IconButton, Switch, Text, useColorModeValue, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { FiMic, FiMonitor, FiX } from "react-icons/fi";

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
      overflow="hidden">
      <VStack spacing={0} align="stretch">
        {/* Header */}
        <HStack justify="space-between" p={4} pb={3}>
          <IconButton aria-label="Close" icon={<Icon as={FiX} />} size="sm" variant="ghost" onClick={onClose} borderRadius="full" />
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
            _hover={{ bg: hoverBg }}>
            <HStack justify="space-between">
              <HStack spacing={3}>
                <Icon as={FiMonitor} color={selectedBorder} />
                <Text fontWeight="medium" fontSize="sm">
                  MacBook Air Camera
                </Text>
              </HStack>
              <Box bg="green.500" color="white" px={2} py={0.5} borderRadius="full" fontSize="xs" fontWeight="bold">
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
                Microphone enabled
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
            borderRadius="lg">
            Start Recording
          </Button>
        </Box>

        {/* Recording Limit */}
        <Text fontSize="xs" color="gray.500" textAlign="center" px={4} pb={3}>
          2 min recording limit
        </Text>

        <Divider />

        {/* Bottom Options */}
        {/* <HStack justify="center" p={3} spacing={6}>
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
        </HStack> */}
      </VStack>
    </Box>
  );
}
