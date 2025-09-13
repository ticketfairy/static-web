import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  VStack,
  Text,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";

interface ReadyToRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRecording: () => void;
}

export function ReadyToRecordModal({ isOpen, onClose, onStartRecording }: ReadyToRecordModalProps) {
  const bgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.600", "gray.400");

  console.log('ReadyToRecordModal rendered, isOpen:', isOpen);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay bg="blackAlpha.300" />
      <ModalContent
        bg={bgColor}
        borderRadius="2xl"
        boxShadow="0 20px 60px rgba(0,0,0,0.15)"
        maxW="380px"
      >
        <ModalBody p={8}>
          <VStack spacing={6}>
            <VStack spacing={3}>
              <Text fontSize="2xl" fontWeight="bold">
                You're ready to record!
              </Text>
              <Text fontSize="sm" color={textColor} textAlign="center">
                The tab you selected to record will be captured once you start recording.
              </Text>
            </VStack>

            <Button
              width="full"
              size="lg"
              bg="orange.500"
              color="white"
              _hover={{ bg: "orange.600" }}
              _active={{ bg: "orange.700" }}
              fontWeight="bold"
              onClick={() => {
                onStartRecording();
                onClose();
              }}
              borderRadius="lg"
              py={6}
            >
              Start Recording
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}