import { Box, Flex, Heading, Text, VStack, SimpleGrid, useColorModeValue, Image, Button, HStack } from "@chakra-ui/react";
import SparkleTrail from "./SparkleTrail";
import { DarkModeToggle } from "./DarkModeToggle";

interface LandingPageProps {
  onNavigateToVideo: () => void;
}

function LandingPage({ onNavigateToVideo }: LandingPageProps) {
  const bgColor = useColorModeValue("white", "gray.900");
  const textColor = useColorModeValue("gray.600", "gray.300");

  return (
    <Box bg={bgColor} minH="100vh">
      <SparkleTrail />
      {/* Header */}
      <Flex as="header" align="center" justify="space-between" wrap="wrap" padding="1.5rem" maxW="1200px" mx="auto" position="sticky" top="0" bg={bgColor} zIndex="1000">
        <Flex align="center" mr={5}>
          <Heading as="h1" size="lg" letterSpacing={"tighter"} color="purple.500" fontFamily="'CS Gordon', 'Arial Black', 'Helvetica Neue', Arial, sans-serif">
            🧚 Ticket Fairy
          </Heading>
        </Flex>

        <HStack spacing={4}>
          <DarkModeToggle />
          <Button
            colorScheme="purple"
            variant="solid"
            size="md"
            onClick={onNavigateToVideo}
            _hover={{
              transform: "translateY(-2px)",
              boxShadow: "lg",
            }}
            transition="all 0.2s"
            fontFamily="'Roboto', 'Helvetica Neue', Arial, sans-serif"
            fontSize="1rem"
            fontWeight="500"
          >
            Ticket Fairy
          </Button>
        </HStack>
      </Flex>

      {/* Demo Video Section */}
      <Box w="full" py={16}>
        <VStack spacing={8} textAlign="center" px={4} maxW="1200px" mx="auto">
            <Box
              w="100%"
              maxW="400px"
              borderRadius="lg"
              overflow="hidden"
            >
              <video
                width="100%"
                height="auto"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                poster=""
                style={{ borderRadius: "8px" }}
              >
              <source src="/demo-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </Box>
        </VStack>
      </Box>

      {/* Hero Section */}
      <Box w="100vw">
        <VStack spacing={4} textAlign="center" py={12} px={4} maxW="1200px" mx="auto">
          <Heading 
            fontWeight={600} 
            fontSize={{ base: "3xl", sm: "4xl", md: "6xl" }} 
            lineHeight={"110%"}
            fontFamily="'CS Gordon', 'Arial Black', 'Helvetica Neue', Arial, sans-serif"
          >
          Wave your wand.{" "} <br />
            <Text as={"span"} color={"purple.400"}>
             Turn videos into tickets.
            </Text>
        </Heading>

          <Text 
            color={textColor} 
            maxW={"3xl"} 
            fontSize="2xl"
            fontFamily="'Bitcount Grid Double', monospace"
            fontWeight="400"
          >
            Record a video explaining what you want. Summon the ticket fairy. Get ready-to-use tickets.<br />
            <br />
          </Text>
        </VStack>

        <Box height={10} />
        <Box mx="auto" maxW="1200px" borderTop="1px solid" borderColor="gray.200" />
        <Box height={20} />

        {/* Problem Section */}
        <Box w="full" py={16}>
          <VStack spacing={24} textAlign="center" px={4} maxW="1200px" mx="auto">
            <Heading fontSize={{ base: "2xl", sm: "3xl", md: "4xl" }} color="purple.400" fontFamily="'CS Gordon', 'Arial Black', 'Helvetica Neue', Arial, sans-serif">
              🦷 Tickets are Toothaches 🦷
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="full">
              <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg">
                <VStack spacing={4}>
                  <Box
                    w="120px"
                    h="120px"
                    borderRadius="lg"
                    overflow="hidden"
                  >
                    <Image
                      src="toothache-1.png"
                      alt="The Rock as Ticket Fairy"
                      w="100%"
                      h="100%"
                      objectFit="cover"
                    />
                  </Box>
                  <Text fontWeight="bold" fontSize="lg" fontFamily="'CS Gordon', 'Arial Black', 'Helvetica Neue', Arial, sans-serif">
                    Hidden Cavities 🦷 🔍 
                  </Text>
                  <Text color={textColor} textAlign="center" fontFamily="'Roboto', 'Helvetica Neue', Arial, sans-serif">
                    Team members work in isolation, creating hidden problems that go undetected until they become painful
                  </Text>
                </VStack>
              </Box>

              <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg">
                <VStack spacing={4}>
                  <Box
                    w="120px"
                    h="120px"
                    borderRadius="lg"
                    overflow="hidden"
                  >
                    <Image
                      src="toothache-2.png"
                      alt="The Rock as Developer Ticket Fairy"
                      w="100%"
                      h="100%"
                      objectFit="cover"
                    />
                  </Box>
                  <Text fontWeight="bold" fontSize="lg" fontFamily="'CS Gordon', 'Arial Black', 'Helvetica Neue', Arial, sans-serif">
                    Endless Root Canal 🦷 ⏰
                  </Text>
                  <Text color={textColor} textAlign="center" fontFamily="'Roboto', 'Helvetica Neue', Arial, sans-serif">
                    Writing detailed tickets feels like a never-ending procedure that drains time and energy
                  </Text>
                </VStack>
              </Box>

              <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg">
                <VStack spacing={4}>
                  <Box
                    w="120px"
                    h="120px"
                    borderRadius="lg"
                    overflow="hidden"
                  >
                    <Image
                      src="toothache-3.png"
                      alt="The Rock as Light Blue Fairy"
                      w="100%"
                      h="100%"
                      objectFit="cover"
                    />
                  </Box>
                  <Text fontWeight="bold" fontSize="lg" fontFamily="'CS Gordon', 'Arial Black', 'Helvetica Neue', Arial, sans-serif">
                    Toothache Without a Cause 🦷 😵 
                  </Text>
                  <Text color={textColor} textAlign="center" fontFamily="'Roboto', 'Helvetica Neue', Arial, sans-serif">
                    Unclear tickets cause confusion and pain, making it impossible to know what's actually needed
                  </Text>
                </VStack>
              </Box>

              <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg">
                <VStack spacing={4}>
                  <Box
                    w="120px"
                    h="120px"
                    borderRadius="lg"
                    overflow="hidden"
                  >
                    <Image
                      src="toothache-4.png"
                      alt="The Rock as Ticket Fairy"
                      w="100%"
                      h="100%"
                      objectFit="cover"
                    />
                  </Box>
                  <Text fontWeight="bold" fontSize="lg" fontFamily="'CS Gordon', 'Arial Black', 'Helvetica Neue', Arial, sans-serif">
                    Wisdom Teeth Coming In 🦷 🌱 
                  </Text>
                  <Text color={textColor} textAlign="center" fontFamily="'Roboto', 'Helvetica Neue', Arial, sans-serif">
                    New team members experience growing pains as they slowly break through existing workflows
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
