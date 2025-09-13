import { Box, Button, Flex, Heading, Text, VStack, Icon, SimpleGrid, useColorModeValue, Textarea, AspectRatio } from "@chakra-ui/react";
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
      <Box w="full" py={{ base: 8, md: 16 }}>
        <VStack spacing={8} px={4} maxW="1200px" mx="auto">
          <Heading fontSize={{ base: "xl", md: "2xl" }} textAlign="center">
            🦷 My{" "}
            <Text as="span" textDecoration="line-through">
              Teeth
            </Text>{" "}
            Tickets 🦷
          </Heading>

          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={{ base: 4, md: 6 }} w="full"></SimpleGrid>
        </VStack>
      </Box>
    </Box>
  );
}

export default MyTicketsPage;
