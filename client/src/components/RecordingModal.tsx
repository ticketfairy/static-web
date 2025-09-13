import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertDescription,
  Progress,
  Icon,
  Flex,
  Box,
  useColorModeValue,
  Circle
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiVideo, FiMic, FiMonitor, FiCheck, FiX } from "react-icons/fi";
import { useState, useEffect } from "react";

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRecording: () => Promise<void>;
  onRequestPermissions: () => Promise<boolean>;
  error: string | null;
  isPreparing: boolean;
}

type ModalStep = 'permissions' | 'countdown' | 'error';

const countdownAnimation = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

export function RecordingModal({
  isOpen,
  onClose,
  onStartRecording,
  onRequestPermissions,
  error,
  isPreparing
}: RecordingModalProps) {
  const [currentStep, setCurrentStep] = useState<ModalStep>('permissions');
  const [countdown, setCountdown] = useState(3);
  const [permissionStatus, setPermissionStatus] = useState({
    screen: false,
    webcam: false,
    microphone: false
  });

  const textColor = useColorModeValue("gray.600", "gray.300");
  const successColor = useColorModeValue("green.500", "green.400");
  const permissionBgColor = useColorModeValue("gray.50", "gray.700");

  useEffect(() => {
    if (error) {
      setCurrentStep('error');
    }
  }, [error]);

  useEffect(() => {
    if (currentStep === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (currentStep === 'countdown' && countdown === 0) {
      onStartRecording();
      onClose();
    }
  }, [currentStep, countdown, onStartRecording, onClose]);

  const handleRequestPermissions = async () => {
    setPermissionStatus({ screen: false, webcam: false, microphone: false });

    const success = await onRequestPermissions();

    if (success) {
      setPermissionStatus({ screen: true, webcam: true, microphone: true });
      setCurrentStep('countdown');
      setCountdown(3);
    }
  };

  const handleClose = () => {
    setCurrentStep('permissions');
    setCountdown(3);
    setPermissionStatus({ screen: false, webcam: false, microphone: false });
    onClose();
  };

  const renderPermissionItem = (
    icon: React.ComponentType,
    label: string,
    status: boolean,
    description: string
  ) => (
    <Flex align="center" justify="space-between" w="full" p={3} borderRadius="md" bg={permissionBgColor}>
      <Flex align="center" gap={3}>
        <Icon as={icon} w={5} h={5} color={status ? successColor : textColor} />
        <Box>
          <Text fontWeight="semibold">{label}</Text>
          <Text fontSize="sm" color={textColor}>{description}</Text>
        </Box>
      </Flex>
      <Circle size="24px" bg={status ? successColor : "gray.300"}>
        <Icon as={status ? FiCheck : FiX} w={3} h={3} color="white" />
      </Circle>
    </Flex>
  );

  const renderPermissionsStep = () => (
    <>
      <ModalHeader>Screen Recording Permissions</ModalHeader>
      <ModalCloseButton />
      <ModalBody pb={6}>
        <VStack spacing={6}>
          <Text color={textColor} textAlign="center">
            To create your screen recording, we need access to your screen, camera, and microphone.
          </Text>

          <VStack spacing={3} w="full">
            {renderPermissionItem(
              FiMonitor,
              "Screen Sharing",
              permissionStatus.screen,
              "Record your screen or selected window"
            )}
            {renderPermissionItem(
              FiVideo,
              "Camera Access",
              permissionStatus.webcam,
              "Show you in the video overlay"
            )}
            {renderPermissionItem(
              FiMic,
              "Microphone Access",
              permissionStatus.microphone,
              "Record your voice narration"
            )}
          </VStack>

          <Button
            colorScheme="purple"
            size="lg"
            w="full"
            onClick={handleRequestPermissions}
            isLoading={isPreparing}
            loadingText="Requesting permissions..."
          >
            Grant Permissions & Start Recording
          </Button>

          <Text fontSize="sm" color={textColor} textAlign="center">
            Your browser will show permission prompts for each access type.
            Please allow all permissions to continue.
          </Text>
        </VStack>
      </ModalBody>
    </>
  );

  const renderCountdownStep = () => (
    <>
      <ModalHeader>Get Ready!</ModalHeader>
      <ModalBody pb={6}>
        <VStack spacing={8}>
          <Text color={textColor} textAlign="center" fontSize="lg">
            Recording will start in:
          </Text>

          <Circle
            size="120px"
            bg="purple.500"
            color="white"
            fontSize="4xl"
            fontWeight="bold"
            animation={`${countdownAnimation} 1s infinite`}
          >
            {countdown}
          </Circle>

          <VStack spacing={2}>
            <Text fontSize="lg" fontWeight="semibold">
              Recording will begin automatically
            </Text>
            <Text color={textColor} textAlign="center">
              Position yourself and your screen how you'd like them to appear in the recording.
            </Text>
          </VStack>

          <Progress
            value={((3 - countdown) / 3) * 100}
            colorScheme="purple"
            w="full"
            size="lg"
            borderRadius="full"
          />
        </VStack>
      </ModalBody>
    </>
  );

  const renderErrorStep = () => (
    <>
      <ModalHeader>Recording Error</ModalHeader>
      <ModalCloseButton />
      <ModalBody pb={6}>
        <VStack spacing={6}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <VStack spacing={4} w="full">
            <Text color={textColor} textAlign="center">
              Common solutions:
            </Text>

            <VStack align="start" spacing={2} w="full" fontSize="sm" color={textColor}>
              <Text>• Make sure you're using Chrome or a Chromium-based browser</Text>
              <Text>• Allow all permission requests when prompted</Text>
              <Text>• Check that your camera and microphone are not being used by other applications</Text>
              <Text>• Try refreshing the page and attempting again</Text>
            </VStack>
          </VStack>

          <VStack w="full" spacing={3}>
            <Button
              colorScheme="purple"
              w="full"
              onClick={() => {
                setCurrentStep('permissions');
                setPermissionStatus({ screen: false, webcam: false, microphone: false });
              }}
            >
              Try Again
            </Button>

            <Button variant="ghost" w="full" onClick={handleClose}>
              Cancel
            </Button>
          </VStack>
        </VStack>
      </ModalBody>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        {currentStep === 'permissions' && renderPermissionsStep()}
        {currentStep === 'countdown' && renderCountdownStep()}
        {currentStep === 'error' && renderErrorStep()}
      </ModalContent>
    </Modal>
  );
}