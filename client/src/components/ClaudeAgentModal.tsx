import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Progress,
  Alert,
  AlertIcon,
  Box,
  Link,
  Icon,
  Spinner,
  useToast,
  Divider,
  Badge,
  Code,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { FiGithub, FiCheck, FiX, FiExternalLink } from "react-icons/fi";

interface ClaudeAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketData: {
    title: string;
    description: string;
  } | null;
  repoName?: string;
  baseBranch?: string;
}

interface AgentProgress {
  step: string;
  status: "pending" | "in_progress" | "completed" | "error";
  message?: string;
}

interface PRResult {
  success: boolean;
  pr_url?: string;
  pr_number?: number;
  error?: string;
}

const PROGRESS_STEPS = [
  { key: "analyzing", label: "Analyzing Ticket", description: "Claude is understanding the requirements" },
  { key: "cloning", label: "Accessing Repository", description: "Cloning repository and analyzing structure" },
  { key: "generating", label: "Generating Code", description: "Creating code changes based on requirements" },
  { key: "creating_pr", label: "Creating Pull Request", description: "Committing changes and opening PR" },
];

function ClaudeAgentModal({
  isOpen,
  onClose,
  ticketData,
  repoName = "ticketfairy/static-web",
  baseBranch = "main",
}: ClaudeAgentModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<AgentProgress[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<PRResult | null>(null);
  const [repoInput, setRepoInput] = useState(repoName);
  const [branchInput, setBranchInput] = useState(baseBranch);
  const toast = useToast();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsGenerating(false);
      setProgress([]);
      setCurrentStep(0);
      setResult(null);
      setRepoInput(repoName);
      setBranchInput(baseBranch);
    }
  }, [isOpen, repoName, baseBranch]);

  const simulateProgress = () => {
    // Simulate progress updates for better UX
    const steps = PROGRESS_STEPS.map((step, index) => ({
      step: step.key,
      status: "pending" as const,
      message: step.description,
    }));

    setProgress(steps);

    // Simulate step-by-step progress
    steps.forEach((_, index) => {
      setTimeout(() => {
        setCurrentStep(index);
        setProgress((prev) =>
          prev.map((step, i) => ({
            ...step,
            status: i === index ? "in_progress" : i < index ? "completed" : "pending",
          }))
        );
      }, index * 2000 + 500);
    });
  };

  const generatePR = async () => {
    if (!ticketData || !repoInput.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide ticket data and repository name",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsGenerating(true);
    setResult(null);
    simulateProgress();

    try {
      const response = await fetch("http://localhost:4000/generate-pr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticket_description: `${ticketData.title}\n\n${ticketData.description}`,
          repo_name: repoInput.trim(),
          base_branch: branchInput.trim() || "main",
        }),
      });

      const data = await response.json();

      // Complete all steps
      setProgress((prev) =>
        prev.map((step) => ({
          ...step,
          status: "completed",
        }))
      );

      if (data.success) {
        setResult({
          success: true,
          pr_url: data.pr_url,
          pr_number: data.pr_number,
        });
        toast({
          title: "PR Created Successfully!",
          description: `Pull request #${data.pr_number} has been created`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        setResult({
          success: false,
          error: data.error || "Failed to create PR",
        });
        // Mark last step as error
        setProgress((prev) =>
          prev.map((step, index) => ({
            ...step,
            status: index === prev.length - 1 ? "error" : step.status,
          }))
        );
      }
    } catch (error) {
      console.error("Error generating PR:", error);
      setResult({
        success: false,
        error: "Network error or server unavailable",
      });
      // Mark current step as error
      setProgress((prev) =>
        prev.map((step, index) => ({
          ...step,
          status: index === currentStep ? "error" : step.status,
        }))
      );
      toast({
        title: "Error",
        description: "Failed to connect to Claude agent",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStepIcon = (status: AgentProgress["status"]) => {
    switch (status) {
      case "completed":
        return <Icon as={FiCheck} color="green.500" />;
      case "error":
        return <Icon as={FiX} color="red.500" />;
      case "in_progress":
        return <Spinner size="sm" color="blue.500" />;
      default:
        return <Box w={4} h={4} borderRadius="full" bg="gray.300" />;
    }
  };

  const getProgressPercentage = () => {
    const completedSteps = progress.filter((step) => step.status === "completed").length;
    return (completedSteps / PROGRESS_STEPS.length) * 100;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" closeOnOverlayClick={!isGenerating}>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
      <ModalContent mx={4} bg="white" borderRadius="xl" shadow="2xl">
        <ModalHeader pb={2}>
          <VStack spacing={2} align="center">
            <HStack spacing={2}>
              <Icon as={FiGithub} w={6} h={6} color="gray.700" />
              <Text fontSize="xl" fontWeight="bold" color="gray.700">
                Claude Code Agent
              </Text>
            </HStack>
            <Text fontSize="sm" color="gray.600" textAlign="center" fontWeight="normal">
              Generate a GitHub PR from your ticket using AI
            </Text>
          </VStack>
        </ModalHeader>
        {!isGenerating && <ModalCloseButton />}

        <ModalBody px={6} pb={6}>
          <VStack spacing={6} align="stretch">
            {/* Ticket Preview */}
            {ticketData && (
              <Box p={4} bg="purple.50" borderRadius="md" borderWidth="1px" borderColor="purple.200">
                <VStack spacing={2} align="start">
                  <HStack>
                    <Badge colorScheme="purple">Ticket</Badge>
                  </HStack>
                  <Text fontWeight="bold" fontSize="sm" color="purple.700">
                    {ticketData.title}
                  </Text>
                  <Text fontSize="xs" color="gray.600" noOfLines={3}>
                    {ticketData.description}
                  </Text>
                </VStack>
              </Box>
            )}

            {/* Configuration */}
            {!isGenerating && !result && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Repository (owner/repo):
                  </Text>
                  <input
                    type="text"
                    value={repoInput}
                    onChange={(e) => setRepoInput(e.target.value)}
                    placeholder="e.g., username/my-repo"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #E2E8F0",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Base Branch:
                  </Text>
                  <input
                    type="text"
                    value={branchInput}
                    onChange={(e) => setBranchInput(e.target.value)}
                    placeholder="main"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #E2E8F0",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  />
                </Box>
              </VStack>
            )}

            {/* Progress */}
            {isGenerating && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="sm" fontWeight="medium">
                      Progress
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {Math.round(getProgressPercentage())}%
                    </Text>
                  </HStack>
                  <Progress value={getProgressPercentage()} colorScheme="blue" size="sm" borderRadius="full" bg="gray.100" />
                </Box>

                <VStack spacing={3} align="stretch">
                  {PROGRESS_STEPS.map((step, index) => {
                    const stepProgress = progress[index];
                    return (
                      <HStack key={step.key} spacing={3} p={3} bg="gray.50" borderRadius="md">
                        {getStepIcon(stepProgress?.status || "pending")}
                        <VStack spacing={1} align="start" flex={1}>
                          <Text fontSize="sm" fontWeight="medium">
                            {step.label}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            {step.description}
                          </Text>
                        </VStack>
                      </HStack>
                    );
                  })}
                </VStack>
              </VStack>
            )}

            {/* Result */}
            {result && (
              <VStack spacing={4} align="stretch">
                {result.success ? (
                  <Alert status="success" borderRadius="md">
                    <AlertIcon />
                    <VStack spacing={2} align="start" flex={1}>
                      <Text fontWeight="bold">Pull Request Created Successfully!</Text>
                      <HStack spacing={2}>
                        <Text fontSize="sm">PR #{result.pr_number}</Text>
                        <Link href={result.pr_url} isExternal color="blue.500" fontSize="sm" fontWeight="medium">
                          <HStack spacing={1}>
                            <Text>View on GitHub</Text>
                            <Icon as={FiExternalLink} w={3} h={3} />
                          </HStack>
                        </Link>
                      </HStack>
                    </VStack>
                  </Alert>
                ) : (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <VStack spacing={2} align="start" flex={1}>
                      <Text fontWeight="bold">Failed to Create PR</Text>
                      <Code fontSize="xs" p={2} borderRadius="md" bg="red.50">
                        {result.error}
                      </Code>
                    </VStack>
                  </Alert>
                )}
              </VStack>
            )}

            {/* Configuration Note */}
            {!isGenerating && (
              <Box p={3} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
                <Text fontSize="xs" color="blue.700">
                  <strong>Note:</strong> Make sure your GitHub token and Anthropic API key are configured in the server environment
                  variables.
                </Text>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            {result?.success && result.pr_url && (
              <Button
                as={Link}
                href={result.pr_url}
                isExternal
                colorScheme="blue"
                variant="outline"
                size="sm"
                leftIcon={<Icon as={FiExternalLink} />}>
                Open PR
              </Button>
            )}

            {!isGenerating && (
              <>
                <Button variant="ghost" onClick={onClose} size="sm">
                  {result ? "Close" : "Cancel"}
                </Button>

                {!result && (
                  <Button
                    colorScheme="purple"
                    onClick={generatePR}
                    isDisabled={!ticketData || !repoInput.trim()}
                    size="sm"
                    leftIcon={<Icon as={FiGithub} />}>
                    Generate PR
                  </Button>
                )}

                {result && !result.success && (
                  <Button colorScheme="purple" onClick={generatePR} size="sm" leftIcon={<Icon as={FiGithub} />}>
                    Retry
                  </Button>
                )}
              </>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ClaudeAgentModal;
