import { Box, Flex, Heading, Text, VStack, SimpleGrid, useColorModeValue, Image, Button } from "@chakra-ui/react";
import TicketFairyButton from "./TicketFairyButton";
import SparkleTrail from "./SparkleTrail";

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
      <Flex as="header" align="center" justify="space-between" wrap="wrap" padding="1.5rem" maxW="1200px" mx="auto">
        <Flex align="center" mr={5}>
          <Heading as="h1" size="lg" letterSpacing={"tighter"} color="purple.500">
            🧚 Ticket Fairy
          </Heading>
        </Flex>

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
        >
          Ticket Fairy
        </Button>
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
            Record a video. Summon the ticket fairy. Get ready-to-use tickets.
          </Text>

          <TicketFairyButton onClick={onNavigateToVideo} />
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
                  <Box
                    w="120px"
                    h="120px"
                    borderRadius="lg"
                    overflow="hidden"
                    boxShadow="md"
                  >
                    <Image
                      src="/image2.png"
                      alt="The Rock as Ticket Fairy"
                      w="100%"
                      h="100%"
                      objectFit="cover"
                    />
                  </Box>
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
                  <Box
                    w="120px"
                    h="120px"
                    borderRadius="lg"
                    overflow="hidden"
                    boxShadow="md"
                  >
                    <Image
                      src="/image1.png"
                      alt="The Rock as Developer Ticket Fairy"
                      w="100%"
                      h="100%"
                      objectFit="cover"
                    />
                  </Box>
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
                  <Box
                    w="120px"
                    h="120px"
                    borderRadius="lg"
                    overflow="hidden"
                    boxShadow="md"
                  >
                    <Image
                      src="/image3.png"
                      alt="The Rock as Light Blue Fairy"
                      w="100%"
                      h="100%"
                      objectFit="cover"
                    />
                  </Box>
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
                  <Box
                    w="120px"
                    h="120px"
                    borderRadius="lg"
                    overflow="hidden"
                    boxShadow="md"
                  >
                    <Image
                      src="/image2.png"
                      alt="The Rock as Ticket Fairy"
                      w="100%"
                      h="100%"
                      objectFit="cover"
                    />
                  </Box>
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

      </Box>

    </Box>
  );
}

export default LandingPage;
