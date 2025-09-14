import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  Text,
  Input,
  FormControl,
  FormLabel,
  useToast,
  Icon,
  Box
} from "@chakra-ui/react";
import { FiZap } from "react-icons/fi";
import { useState, useEffect } from "react";

interface TicketNamingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: (ticketName: string) => void;
  ticketNumber: number;
}

export function TicketNamingModal({
  isOpen,
  onClose,
  onNext,
  ticketNumber
}: TicketNamingModalProps) {
  const [ticketName, setTicketName] = useState("");
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setTicketName(`My Ticket ${ticketNumber}`);
    }
  }, [isOpen, ticketNumber]);

  const handleNext = () => {
    if (!ticketName.trim()) {
      toast({
        title: "Ticket Name Required",
        description: "Please enter a name for your ticket",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    onNext(ticketName.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNext();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <VStack spacing={2} align="center">
            <Icon as={FiZap} w={8} h={8} color="purple.500" />
            <Text fontSize="lg" fontWeight="bold">
              Name Your Ticket
            </Text>
          </VStack>
        </ModalHeader>

        <ModalBody pb={6}>
          <VStack spacing={6}>
            <Text color="gray.600" textAlign="center">
              Give your ticket a descriptive name so you can easily identify it later
            </Text>

            <FormControl>
              <FormLabel>Ticket Name</FormLabel>
              <Input
                value={ticketName}
                onChange={(e) => setTicketName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter ticket name..."
                size="lg"
                autoFocus
              />
            </FormControl>

            <Box
              p={4}
              bg="purple.50"
              borderRadius="md"
              w="full"
            >
              <Text fontSize="sm" color="purple.700" textAlign="center">
                💡 Tip: Use descriptive names like "Fix login bug" or "Add user dashboard feature"
              </Text>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="purple" onClick={handleNext}>
            Continue to AI Processing
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
