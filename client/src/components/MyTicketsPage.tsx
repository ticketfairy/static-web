import { Box, Button, Flex, Heading, Text, VStack, Icon, SimpleGrid, useColorModeValue, Textarea } from "@chakra-ui/react";
import { FiVideo } from "react-icons/fi";
import { useState } from "react";

interface MyTicketsPageProps {
  onNavigateToLanding: () => void;
}

function MyTicketsPage({ onNavigateToLanding }: MyTicketsPageProps) {
  const bgColor = useColorModeValue("white", "gray.900");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const [video1Notes, setVideo1Notes] = useState<string>("");
  const [video2Notes, setVideo2Notes] = useState<string>("");
  const [video3Notes, setVideo3Notes] = useState<string>("");

  return (
    <Box bg={bgColor} minH="100vh">
      {/* Header */}
      <Flex as="header" align="center" justify="space-between" wrap="wrap" padding="1.5rem" maxW="1200px" mx="auto">
        <Flex align="center" mr={5}>
          <Heading as="h1" size="lg" letterSpacing={"tighter"} color="purple.500" cursor="pointer" onClick={onNavigateToLanding}>
            🧚 Ticket Fairy
          </Heading>
        </Flex>
      </Flex>

      {/* My Teeth Tickets Section */}
      <Box w="full" py={16}>
        <VStack spacing={8} px={4} maxW="1200px" mx="auto">
          <Heading fontSize="2xl" textAlign="center">
            🦷 My <Text as="span" textDecoration="line-through">Teeth</Text> Tickets 🦷
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="full">
            {/* Video 1: Fix Login Bug */}
            <Box p={6} shadow="lg" borderWidth="1px" borderRadius="lg" bg={bgColor}>
              <VStack spacing={4} align="stretch">
                <Box
                  h="150px"
                  bg="purple.100"
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  position="relative"
                >
                  <Icon as={FiVideo} w={12} h={12} color="purple.500" />
                  <Text
                    position="absolute"
                    bottom={2}
                    right={2}
                    bg="blackAlpha.700"
                    color="white"
                    px={2}
                    py={1}
                    borderRadius="sm"
                    fontSize="xs"
                  >
                    2:34
                  </Text>
                </Box>

                <VStack spacing={2} align="start">
                  <Text fontWeight="bold" fontSize="lg" textAlign="left">
                    Fix Login Bug
                  </Text>
                  <Text color={textColor} fontSize="sm" textAlign="left">
                    Screen recording showing authentication issue reproduction and debugging steps
                  </Text>
                </VStack>

                <Textarea
                  placeholder="Add your notes about this video..."
                  value={video1Notes}
                  onChange={(e) => setVideo1Notes(e.target.value)}
                  resize="vertical"
                  minH="100px"
                  bg="gray.50"
                />

                <Flex gap={2}>
                  <Button size="sm" colorScheme="purple" variant="outline" flex={1}>
                    Play
                  </Button>
                  <Button size="sm" colorScheme="purple" variant="ghost" flex={1}>
                    Download
                  </Button>
                </Flex>

                <Button size="sm" colorScheme="purple" variant="solid" w="full">
                  ✨ 🧚 TICKET ✨
                </Button>
              </VStack>
            </Box>

            {/* Video 2: New Dashboard Feature */}
            <Box p={6} shadow="lg" borderWidth="1px" borderRadius="lg" bg={bgColor}>
              <VStack spacing={4} align="stretch">
                <Box
                  h="150px"
                  bg="blue.100"
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  position="relative"
                >
                  <Icon as={FiVideo} w={12} h={12} color="blue.500" />
                  <Text
                    position="absolute"
                    bottom={2}
                    right={2}
                    bg="blackAlpha.700"
                    color="white"
                    px={2}
                    py={1}
                    borderRadius="sm"
                    fontSize="xs"
                  >
                    4:12
                  </Text>
                </Box>

                <VStack spacing={2} align="start">
                  <Text fontWeight="bold" fontSize="lg" textAlign="left">
                    New Dashboard Feature
                  </Text>
                  <Text color={textColor} fontSize="sm" textAlign="left">
                    Walkthrough of implementing user analytics dashboard with real-time data
                  </Text>
                </VStack>

                <Textarea
                  placeholder="Add your notes about this video..."
                  value={video2Notes}
                  onChange={(e) => setVideo2Notes(e.target.value)}
                  resize="vertical"
                  minH="100px"
                  bg="gray.50"
                />

                <Flex gap={2}>
                  <Button size="sm" colorScheme="purple" variant="outline" flex={1}>
                    Play
                  </Button>
                  <Button size="sm" colorScheme="purple" variant="ghost" flex={1}>
                    Download
                  </Button>
                </Flex>

                <Button size="sm" colorScheme="purple" variant="solid" w="full">
                  ✨ 🧚 TICKET ✨
                </Button>
              </VStack>
            </Box>

            {/* Video 3: Database Migration */}
            <Box p={6} shadow="lg" borderWidth="1px" borderRadius="lg" bg={bgColor}>
              <VStack spacing={4} align="stretch">
                <Box
                  h="150px"
                  bg="green.100"
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  position="relative"
                >
                  <Icon as={FiVideo} w={12} h={12} color="green.500" />
                  <Text
                    position="absolute"
                    bottom={2}
                    right={2}
                    bg="blackAlpha.700"
                    color="white"
                    px={2}
                    py={1}
                    borderRadius="sm"
                    fontSize="xs"
                  >
                    6:45
                  </Text>
                </Box>

                <VStack spacing={2} align="start">
                  <Text fontWeight="bold" fontSize="lg" textAlign="left">
                    Database Migration
                  </Text>
                  <Text color={textColor} fontSize="sm" textAlign="left">
                    Step-by-step database schema update and data migration process
                  </Text>
                </VStack>

                <Textarea
                  placeholder="Add your notes about this video..."
                  value={video3Notes}
                  onChange={(e) => setVideo3Notes(e.target.value)}
                  resize="vertical"
                  minH="100px"
                  bg="gray.50"
                />

                <Flex gap={2}>
                  <Button size="sm" colorScheme="purple" variant="outline" flex={1}>
                    Play
                  </Button>
                  <Button size="sm" colorScheme="purple" variant="ghost" flex={1}>
                    Download
                  </Button>
                </Flex>

                <Button size="sm" colorScheme="purple" variant="solid" w="full">
                  ✨ 🧚 TICKET ✨
                </Button>
              </VStack>
            </Box>
          </SimpleGrid>
        </VStack>
      </Box>
    </Box>
  );
}

export default MyTicketsPage;