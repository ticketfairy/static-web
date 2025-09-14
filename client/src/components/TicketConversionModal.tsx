import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Text,
  Button
} from "@chakra-ui/react";

interface TicketConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoBlob: Blob | null;
  onSaveTicket: () => void;
  ticketName?: string;
}

export function TicketConversionModal({
  isOpen,
  onClose,
  videoBlob,
  onSaveTicket,
  ticketName
}: TicketConversionModalProps) {

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Ticket Conversion</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <Text textAlign="center">
              This modal is no longer used for AI processing.
            </Text>
            <Button onClick={onClose} colorScheme="purple">
              Close
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}