import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Icon,
  Progress,
  Spinner,
  Textarea,
  Input,
  FormControl,
  FormLabel,
  Select,
  Divider,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription
} from "@chakra-ui/react";
import { FiCheck, FiCopy, FiSave } from "react-icons/fi";
import { useState, useEffect } from "react";

interface TicketData {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  type: 'Bug' | 'Feature' | 'Enhancement' | 'Task';
  estimatedTime: string;
  acceptanceCriteria: string[];
  tags: string[];
}

interface TicketConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoBlob: Blob | null;
  onSaveTicket: (ticket: TicketData) => void;
}

type ConversionStep = 'processing' | 'review' | 'completed';

export function TicketConversionModal({
  isOpen,
  onClose,
  videoBlob,
  onSaveTicket
}: TicketConversionModalProps) {
  const [currentStep, setCurrentStep] = useState<ConversionStep>('processing');
  const [progress, setProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('Initializing...');
  const [ticketData, setTicketData] = useState<TicketData>({
    title: '',
    description: '',
    priority: 'Medium',
    type: 'Task',
    estimatedTime: '',
    acceptanceCriteria: [],
    tags: []
  });
  const toast = useToast();

  useEffect(() => {
    if (isOpen && videoBlob) {
      simulateAIProcessing();
    }
  }, [isOpen, videoBlob]);

  const simulateAIProcessing = async () => {
    setCurrentStep('processing');
    setProgress(0);

    const steps = [
      { message: 'Analyzing video content...', duration: 2000 },
      { message: 'Extracting audio transcript...', duration: 2500 },
      { message: 'Identifying key requirements...', duration: 2000 },
      { message: 'Generating ticket structure...', duration: 1500 },
      { message: 'Finalizing details...', duration: 1000 }
    ];

    for (let i = 0; i < steps.length; i++) {
      setProcessingMessage(steps[i].message);
      setProgress(((i + 1) / steps.length) * 100);
      await new Promise(resolve => setTimeout(resolve, steps[i].duration));
    }

    // Simulate AI-generated ticket data
    const mockTicket: TicketData = {
      title: 'Fix user authentication bug in login flow',
      description: `Based on the screen recording analysis, there appears to be an issue with the user authentication process.

The video shows:
- User attempting to log in with valid credentials
- Login form submitting successfully
- Unexpected redirect to error page instead of dashboard
- No clear error message displayed to user

This affects user experience and may be preventing legitimate users from accessing the application.`,
      priority: 'High',
      type: 'Bug',
      estimatedTime: '2-3 hours',
      acceptanceCriteria: [
        'User can successfully log in with valid credentials',
        'User is redirected to appropriate dashboard after login',
        'Clear error messages are shown for invalid credentials',
        'Login flow works consistently across different browsers'
      ],
      tags: ['authentication', 'login', 'bug', 'user-experience']
    };

    setTicketData(mockTicket);
    setCurrentStep('review');
  };

  const handleFieldChange = (field: keyof TicketData, value: string | string[]) => {
    setTicketData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveTicket = () => {
    onSaveTicket(ticketData);
    setCurrentStep('completed');

    toast({
      title: "Ticket Saved",
      description: "Your AI-generated ticket has been saved successfully!",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleCopyTicket = () => {
    const ticketText = `
# ${ticketData.title}

**Type:** ${ticketData.type}
**Priority:** ${ticketData.priority}
**Estimated Time:** ${ticketData.estimatedTime}

## Description
${ticketData.description}

## Acceptance Criteria
${ticketData.acceptanceCriteria.map((criteria, i) => `${i + 1}. ${criteria}`).join('\n')}

## Tags
${ticketData.tags.join(', ')}
    `.trim();

    navigator.clipboard.writeText(ticketText);

    toast({
      title: "Copied to Clipboard",
      description: "Ticket content copied to clipboard!",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  const renderProcessingStep = () => (
    <VStack spacing={6} py={8}>
      <Spinner size="xl" color="purple.500" thickness="4px" />

      <VStack spacing={3}>
        <Text fontSize="lg" fontWeight="semibold">
          AI is processing your video...
        </Text>
        <Text color="gray.600" textAlign="center">
          {processingMessage}
        </Text>
      </VStack>

      <Box w="full">
        <Progress
          value={progress}
          colorScheme="purple"
          borderRadius="full"
          height="8px"
        />
        <Text fontSize="sm" color="gray.500" mt={2} textAlign="center">
          {Math.round(progress)}% complete
        </Text>
      </Box>
    </VStack>
  );

  const renderReviewStep = () => (
    <VStack spacing={6} align="stretch">
      <Alert status="success" borderRadius="md">
        <AlertIcon />
        <AlertDescription>
          AI has successfully analyzed your video and generated a ticket. Please review and edit as needed.
        </AlertDescription>
      </Alert>

      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel>Title</FormLabel>
          <Input
            value={ticketData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="Enter ticket title"
          />
        </FormControl>

        <HStack spacing={4}>
          <FormControl>
            <FormLabel>Type</FormLabel>
            <Select
              value={ticketData.type}
              onChange={(e) => handleFieldChange('type', e.target.value as TicketData['type'])}
            >
              <option value="Bug">Bug</option>
              <option value="Feature">Feature</option>
              <option value="Enhancement">Enhancement</option>
              <option value="Task">Task</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Priority</FormLabel>
            <Select
              value={ticketData.priority}
              onChange={(e) => handleFieldChange('priority', e.target.value as TicketData['priority'])}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Estimated Time</FormLabel>
            <Input
              value={ticketData.estimatedTime}
              onChange={(e) => handleFieldChange('estimatedTime', e.target.value)}
              placeholder="e.g., 2-3 hours"
            />
          </FormControl>
        </HStack>

        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea
            value={ticketData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Detailed description of the task or issue"
            rows={6}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Acceptance Criteria</FormLabel>
          <Textarea
            value={ticketData.acceptanceCriteria.join('\n')}
            onChange={(e) => handleFieldChange('acceptanceCriteria', e.target.value.split('\n').filter(Boolean))}
            placeholder="Enter each criteria on a new line"
            rows={4}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Tags</FormLabel>
          <Input
            value={ticketData.tags.join(', ')}
            onChange={(e) => handleFieldChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
            placeholder="Comma-separated tags"
          />
        </FormControl>
      </VStack>

      <Divider />

      <HStack spacing={3}>
        <Button
          flex={1}
          leftIcon={<Icon as={FiSave} />}
          colorScheme="purple"
          onClick={handleSaveTicket}
        >
          Save Ticket
        </Button>

        <Button
          leftIcon={<Icon as={FiCopy} />}
          variant="outline"
          onClick={handleCopyTicket}
        >
          Copy
        </Button>
      </HStack>
    </VStack>
  );

  const renderCompletedStep = () => (
    <VStack spacing={6} py={8}>
      <Box
        w="60px"
        h="60px"
        bg="green.500"
        borderRadius="50%"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Icon as={FiCheck} w={8} h={8} color="white" />
      </Box>

      <VStack spacing={3}>
        <Text fontSize="lg" fontWeight="semibold">
          Ticket Created Successfully!
        </Text>
        <Text color="gray.600" textAlign="center">
          Your AI-generated ticket has been saved and is ready to use.
        </Text>
      </VStack>

      <Button onClick={onClose}>
        Close
      </Button>
    </VStack>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent maxW="800px">
        <ModalHeader>
          {currentStep === 'processing' && 'AI Processing'}
          {currentStep === 'review' && 'Review Generated Ticket'}
          {currentStep === 'completed' && 'Ticket Created'}
        </ModalHeader>
        {currentStep !== 'processing' && <ModalCloseButton />}

        <ModalBody pb={6}>
          {currentStep === 'processing' && renderProcessingStep()}
          {currentStep === 'review' && renderReviewStep()}
          {currentStep === 'completed' && renderCompletedStep()}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}