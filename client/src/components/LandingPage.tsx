import { Box, Button, Flex, Heading, Text, VStack, Icon, SimpleGrid, useColorModeValue } from "@chakra-ui/react";
import { FiVideo, FiMic, FiUsers, FiClock, FiTrendingUp, FiSearch, FiHelpCircle } from "react-icons/fi";

interface LandingPageProps {
  onNavigateToVideo: () => void;
}

function LandingPage({ onNavigateToVideo }: LandingPageProps) {
  const bgColor = useColorModeValue("white", "gray.900");
  const textColor = useColorModeValue("gray.600", "gray.300");

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

          <Button colorScheme="purple" size="lg" rightIcon={<Icon as={FiVideo} />} onClick={onNavigateToVideo}>
            Ticket Fairy
          </Button>
        </VStack>

        {/* Problem Section */}
        <Box w="full" py={16}>
          <VStack spacing={8} textAlign="center" px={4} maxW="1200px" mx="auto">
            <Heading fontSize="3xl" color="red.400">
              🧚‍♀️ Tickets are Toothaches 🦷
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="full">
              <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg">
                <VStack spacing={4}>
                  <Icon as={FiSearch} w={10} h={10} color="red.400" />
                  <Text fontWeight="bold" fontSize="lg">
                    🦷🔍 Hidden Cavities
                  </Text>
                  <Text color={textColor} textAlign="center">
                    Team members work in isolation, creating hidden problems that go undetected until they become painful
                  </Text>
                </VStack>
              </Box>

              <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg">
                <VStack spacing={4}>
                  <Icon as={FiClock} w={10} h={10} color="red.400" />
                  <Text fontWeight="bold" fontSize="lg">
                    ⏰🦷 Endless Root Canal
                  </Text>
                  <Text color={textColor} textAlign="center">
                    Writing detailed tickets feels like a never-ending procedure that drains time and energy
                  </Text>
                </VStack>
              </Box>

              <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg">
                <VStack spacing={4}>
                  <Icon as={FiHelpCircle} w={10} h={10} color="red.400" />
                  <Text fontWeight="bold" fontSize="lg">
                    😵🦷 Toothache Without a Cause
                  </Text>
                  <Text color={textColor} textAlign="center">
                    Unclear tickets cause confusion and pain, making it impossible to know what's actually needed
                  </Text>
                </VStack>
              </Box>

              <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg">
                <VStack spacing={4}>
                  <Icon as={FiTrendingUp} w={10} h={10} color="red.400" />
                  <Text fontWeight="bold" fontSize="lg">
                    🌱🦷 Wisdom Teeth Coming In
                  </Text>
                  <Text color={textColor} textAlign="center">
                    New team members experience growing pains as they slowly break through existing workflows
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

      </Box>

    </Box>
  );
}

export default LandingPage;
