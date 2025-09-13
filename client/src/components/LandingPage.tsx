import { Box, Button, Flex, Heading, Text, VStack, HStack, Icon, SimpleGrid, useColorModeValue, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, useDisclosure, Input } from "@chakra-ui/react";
import { FiVideo, FiMic, FiEdit, FiUsers, FiClock, FiTrendingUp, FiUpload, FiCamera } from "react-icons/fi";
import { useState, useRef } from "react";

function LandingPage() {
  const bgColor = useColorModeValue("white", "gray.900");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRecordClick = () => {
    setIsRecording(true);
    // TODO: Implement video recording functionality
    alert('Video recording functionality will be implemented soon!');
    setIsRecording(false);
  };

  return (
    <Box bg={bgColor} minH="100vh">
      {/* Header */}
      <Flex as="header" align="center" justify="space-between" wrap="wrap" padding="1.5rem" maxW="1200px" mx="auto">
        <Flex align="center" mr={5}>
          <Heading as="h1" size="lg" letterSpacing={"tighter"} color="purple.500">
            🧚 Ticket Fairy
          </Heading>
        </Flex>

      </Flex>

      {/* Hero Section */}
      <Box w="100vw">
        <VStack spacing={8} textAlign="center" py={20} px={4} maxW="1200px" mx="auto">
          <Heading fontWeight={600} fontSize={{ base: "3xl", sm: "4xl", md: "6xl" }} lineHeight={"110%"}>
            Make creating tickets as easy as{" "}
            <Text as={"span"} color={"purple.400"}>
              explaining them out loud
            </Text>
          </Heading>

          <Text color={textColor} maxW={"3xl"} fontSize="xl">
            Record a short video of yourself talking and your screen. AI transforms it into structured, ready-to-use tickets while
            preserving the video for richer context.
          </Text>

          <Button colorScheme="purple" size="lg" rightIcon={<Icon as={FiVideo} />} onClick={onOpen}>
            Create Ticket
          </Button>
        </VStack>

        {/* Problem Section */}
        <Box w="full" py={16}>
          <VStack spacing={8} textAlign="center" px={4} maxW="1200px" mx="auto">
            <Heading fontSize="3xl" color="red.400">
              The Problems We Solve
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="full">
              <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg">
                <VStack spacing={4}>
                  <Icon as={FiUsers} w={10} h={10} color="red.400" />
                  <Text fontWeight="bold" fontSize="lg">
                    Poor Team Visibility
                  </Text>
                  <Text color={textColor} textAlign="center">
                    Developers often have little understanding of what other team members are working on
                  </Text>
                </VStack>
              </Box>

              <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg">
                <VStack spacing={4}>
                  <Icon as={FiClock} w={10} h={10} color="red.400" />
                  <Text fontWeight="bold" fontSize="lg">
                    Time-Consuming Documentation
                  </Text>
                  <Text color={textColor} textAlign="center">
                    Writing tickets is time consuming and often doesn't capture all the detail needed
                  </Text>
                </VStack>
              </Box>

              <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg">
                <VStack spacing={4}>
                  <Icon as={FiEdit} w={10} h={10} color="red.400" />
                  <Text fontWeight="bold" fontSize="lg">
                    Vague Requirements
                  </Text>
                  <Text color={textColor} textAlign="center">
                    Tickets are sometimes vague, making it hard for team members to understand the work
                  </Text>
                </VStack>
              </Box>

              <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg">
                <VStack spacing={4}>
                  <Icon as={FiTrendingUp} w={10} h={10} color="red.400" />
                  <Text fontWeight="bold" fontSize="lg">
                    Slow Onboarding
                  </Text>
                  <Text color={textColor} textAlign="center">
                    High barrier of entry for new team members, leading to slower onboarding times
                  </Text>
                </VStack>
              </Box>
            </SimpleGrid>
          </VStack>
        </Box>

        {/* Solution Section */}
        <Box w="full" py={16}>
          <VStack spacing={8} textAlign="center" px={4} maxW="1200px" mx="auto">
            <Heading fontSize="3xl" color="purple.400">
              Our Solution
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full">
              <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg">
                <VStack spacing={4}>
                  <Icon as={FiVideo} w={10} h={10} color="purple.400" />
                  <Text fontWeight="bold" fontSize="lg">
                    Screen + Video Recording
                  </Text>
                  <Text color={textColor} textAlign="center">
                    Capture both your screen and yourself talking for complete context
                  </Text>
                </VStack>
              </Box>

              <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg">
                <VStack spacing={4}>
                  <Icon as={FiMic} w={10} h={10} color="purple.400" />
                  <Text fontWeight="bold" fontSize="lg">
                    AI-Powered Processing
                  </Text>
                  <Text color={textColor} textAlign="center">
                    AI transforms your explanation into structured, ready-to-use tickets
                  </Text>
                </VStack>
              </Box>

              <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg">
                <VStack spacing={4}>
                  <Icon as={FiUsers} w={10} h={10} color="purple.400" />
                  <Text fontWeight="bold" fontSize="lg">
                    Delightful Experience
                  </Text>
                  <Text color={textColor} textAlign="center">
                    Human-centered UI that makes team collaboration easy and exciting
                  </Text>
                </VStack>
              </Box>
            </SimpleGrid>
          </VStack>
        </Box>

        {/* CTA Section */}
        <Box w="full" py={16} textAlign="center">
          <VStack spacing={6} px={4} maxW="1200px" mx="auto">
            <Heading fontSize="2xl">Ready to transform your team's workflow?</Heading>
            <Text color={textColor} fontSize="lg">
              Make working with your team easy and exciting. Abstract the annoying tasks.
            </Text>
            <Button colorScheme="purple" size="lg" rightIcon={<Icon as={FiVideo} />} onClick={onOpen}>
              Create Ticket
            </Button>
          </VStack>
        </Box>
      </Box>

      {/* Video Upload Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Ticket</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6}>
              <Text color={textColor} textAlign="center">
                Choose how you'd like to create your ticket:
              </Text>

              <VStack spacing={4} w="full">
                <Button
                  leftIcon={<Icon as={FiUpload} />}
                  colorScheme="purple"
                  variant="outline"
                  size="lg"
                  w="full"
                  onClick={handleUploadClick}
                >
                  Upload Video
                </Button>

                <Button
                  leftIcon={<Icon as={FiCamera} />}
                  colorScheme="purple"
                  size="lg"
                  w="full"
                  onClick={handleRecordClick}
                  isLoading={isRecording}
                  loadingText="Starting Recording..."
                >
                  Record Video
                </Button>
              </VStack>

              {selectedFile && (
                <Box p={4} borderRadius="md" bg="gray.50" w="full">
                  <Text fontSize="sm" color="gray.600">
                    Selected file: {selectedFile.name}
                  </Text>
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Hidden file input */}
      <Input
        type="file"
        accept="video/*"
        ref={fileInputRef}
        onChange={handleFileSelect}
        display="none"
      />
    </Box>
  );
}

export default LandingPage;
