import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Input,
  Text,
  useToast,
  Alert,
  AlertIcon,
  FormControl,
  FormLabel,
  FormHelperText,
  Box,
  Tag,
  TagLabel,
  TagCloseButton,
  Textarea,
  Divider,
  Icon,
  Link,
} from "@chakra-ui/react";
import { FiGithub, FiExternalLink, FiPlus, FiCheck } from "react-icons/fi";

interface GitHubIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketTitle: string;
  ticketDescription: string;
}

interface RepoInfo {
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  has_issues: boolean;
  permissions: {
    admin?: boolean;
    push?: boolean;
    pull?: boolean;
  };
}

export const GitHubIssueModal: React.FC<GitHubIssueModalProps> = ({ isOpen, onClose, ticketTitle, ticketDescription }) => {
  const [repoName, setRepoName] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [newAssignee, setNewAssignee] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [repoError, setRepoError] = useState("");
  const [createdIssue, setCreatedIssue] = useState<{
    issue_number: number;
    issue_url: string;
    issue_id: number;
    title: string;
    state: string;
    created_at: string;
    repository: string;
  } | null>(null);

  const toast = useToast();

  // Load saved repository from localStorage
  useEffect(() => {
    const savedRepo = localStorage.getItem("ticketfairy_github_repo");
    if (savedRepo) {
      setRepoName(savedRepo);
      validateRepository(savedRepo);
    }
  }, []);

  // Validate repository access
  const validateRepository = async (repo: string) => {
    if (!repo.trim() || !repo.includes("/")) {
      setRepoInfo(null);
      setRepoError("");
      return;
    }

    setIsValidating(true);
    setRepoError("");

    try {
      const response = await fetch("http://localhost:4000/github-repo-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_name: repo,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setRepoInfo(result);
        if (!result.has_issues) {
          setRepoError("Issues are disabled for this repository");
        }
      } else {
        setRepoError(result.error || "Could not access repository");
        setRepoInfo(null);
      }
    } catch {
      setRepoError("Failed to validate repository");
      setRepoInfo(null);
    } finally {
      setIsValidating(false);
    }
  };

  // Handle repository name change
  const handleRepoChange = (value: string) => {
    setRepoName(value);
    setCreatedIssue(null);

    // Save to localStorage
    if (value.trim()) {
      localStorage.setItem("ticketfairy_github_repo", value);
    }

    // Debounced validation
    setTimeout(() => {
      validateRepository(value);
    }, 500);
  };

  // Create GitHub issue
  const createGitHubIssue = async () => {
    if (!repoName.trim()) {
      toast({
        title: "Repository Required",
        description: "Please enter a repository name",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (repoError || !repoInfo?.has_issues) {
      toast({
        title: "Repository Issues",
        description: repoError || "Issues are not enabled for this repository",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("http://localhost:4000/create-github-issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: ticketTitle,
          description: ticketDescription,
          repo_name: repoName,
          labels: labels,
          assignees: assignees,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCreatedIssue(result);
        toast({
          title: "GitHub Issue Created!",
          description: `Issue #${result.issue_number} created successfully`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Failed to Create Issue",
          description: result.error || "Unknown error occurred",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("GitHub API error:", error);
      toast({
        title: "Error",
        description: "Failed to connect to GitHub API",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Reset modal state
  const handleClose = () => {
    setCreatedIssue(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={2}>
            <Icon as={FiGithub} w={6} h={6} />
            <Text>Create GitHub Issue</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Success State */}
            {createdIssue && (
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                <VStack spacing={2} align="start" flex={1}>
                  <Text fontWeight="semibold">Issue #{createdIssue.issue_number} created successfully!</Text>
                  <Link href={createdIssue.issue_url} isExternal color="blue.500" fontSize="sm" display="flex" alignItems="center" gap={1}>
                    View on GitHub <Icon as={FiExternalLink} w={3} h={3} />
                  </Link>
                </VStack>
              </Alert>
            )}

            {/* Repository Configuration */}
            <FormControl>
              <FormLabel>Repository</FormLabel>
              <Input
                placeholder="owner/repository-name"
                value={repoName}
                onChange={(e) => handleRepoChange(e.target.value)}
                isDisabled={isCreating}
              />
              <FormHelperText>Enter the GitHub repository in format "owner/repo"</FormHelperText>

              {/* Repository Validation Status */}
              {isValidating && (
                <Box mt={2} p={2} bg="blue.50" borderRadius="md">
                  <Text fontSize="sm" color="blue.600">
                    Validating repository access...
                  </Text>
                </Box>
              )}

              {repoError && (
                <Box mt={2} p={2} bg="red.50" borderRadius="md">
                  <Text fontSize="sm" color="red.600">
                    {repoError}
                  </Text>
                </Box>
              )}

              {repoInfo && !repoError && (
                <Box mt={2} p={3} bg="green.50" borderRadius="md" borderWidth="1px" borderColor="green.200">
                  <VStack spacing={2} align="start">
                    <HStack>
                      <Icon as={FiCheck} color="green.500" />
                      <Text fontSize="sm" fontWeight="semibold" color="green.700">
                        Repository Validated
                      </Text>
                    </HStack>
                    <VStack spacing={1} align="start" fontSize="xs" color="green.600">
                      <Text>
                        <strong>Name:</strong> {repoInfo.full_name}
                      </Text>
                      {repoInfo.description && (
                        <Text>
                          <strong>Description:</strong> {repoInfo.description}
                        </Text>
                      )}
                      <Text>
                        <strong>Issues:</strong> {repoInfo.has_issues ? "Enabled" : "Disabled"}
                      </Text>
                      <Text>
                        <strong>Access:</strong> {repoInfo.private ? "Private" : "Public"}
                      </Text>
                    </VStack>
                  </VStack>
                </Box>
              )}
            </FormControl>

            {/* Ticket Preview */}
            <Box>
              <Text fontWeight="semibold" mb={2}>
                Issue Preview:
              </Text>
              <Box p={3} bg="gray.50" borderRadius="md" borderWidth="1px">
                <VStack spacing={2} align="start">
                  <Text fontSize="sm" fontWeight="semibold">
                    Title:
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    {ticketTitle}
                  </Text>

                  <Text fontSize="sm" fontWeight="semibold">
                    Description:
                  </Text>
                  <Box maxH="100px" overflowY="auto" w="full">
                    <Textarea value={ticketDescription} isReadOnly size="sm" resize="none" minH="80px" bg="white" />
                  </Box>
                </VStack>
              </Box>
            </Box>

            <Divider />
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClose}>
              {createdIssue ? "Close" : "Cancel"}
            </Button>
            {!createdIssue && (
              <Button
                colorScheme="gray"
                onClick={createGitHubIssue}
                isLoading={isCreating}
                loadingText="Creating Issue..."
                isDisabled={!repoName.trim() || !!repoError || !repoInfo?.has_issues}
                leftIcon={<Icon as={FiGithub} />}>
                Create Issue
              </Button>
            )}
            {createdIssue && (
              <Button
                colorScheme="blue"
                onClick={() => window.open(createdIssue.issue_url, "_blank")}
                leftIcon={<Icon as={FiExternalLink} />}>
                View Issue
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
