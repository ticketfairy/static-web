import { Box, Button, Flex, Heading, Text, VStack, Icon, SimpleGrid, useColorModeValue, Badge, Card, CardBody, CardHeader, HStack, Tag, TagLabel } from "@chakra-ui/react";
import { FiVideo, FiCalendar, FiClock, FiTrash2, FiPlay, FiCopy } from "react-icons/fi";
import { useTickets } from "../hooks/useTickets";

interface MyTicketsPageProps {
  onNavigateToLanding: () => void;
}

function MyTicketsPage({ onNavigateToLanding }: MyTicketsPageProps) {
  const bgColor = useColorModeValue("white", "gray.900");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const cardBg = useColorModeValue("white", "gray.800");
  const { tickets, deleteTicket } = useTickets();

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

          {tickets.length === 0 ? (
            <VStack spacing={4} py={12}>
              <Icon as={FiVideo} w={16} h={16} color="gray.400" />
              <Text fontSize="lg" color="gray.500" textAlign="center">
                No tickets yet! Create your first ticket by recording a video.
              </Text>
            </VStack>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={{ base: 4, md: 6 }} w="full">
              {tickets.map((ticket) => (
                <Card key={ticket.id} bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
                  <CardHeader pb={2}>
                    <VStack align="start" spacing={2}>
                      <HStack justify="space-between" w="full">
                        <Text fontSize="lg" fontWeight="bold" color="purple.500" noOfLines={2}>
                          {ticket.name}
                        </Text>
                        <Button
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => deleteTicket(ticket.id)}
                        >
                          <Icon as={FiTrash2} />
                        </Button>
                      </HStack>
                      <Text fontSize="sm" color="gray.500" noOfLines={2}>
                        {ticket.title}
                      </Text>
                    </VStack>
                  </CardHeader>
                  
                  <CardBody pt={0}>
                    <VStack align="start" spacing={3}>
                      <HStack spacing={2} wrap="wrap">
                        <Badge colorScheme={
                          ticket.priority === 'Critical' ? 'red' :
                          ticket.priority === 'High' ? 'orange' :
                          ticket.priority === 'Medium' ? 'yellow' : 'green'
                        }>
                          {ticket.priority}
                        </Badge>
                        <Badge colorScheme="blue" variant="outline">
                          {ticket.type}
                        </Badge>
                      </HStack>

                      {ticket.videoLink && (
                        <Box w="full">
                          <HStack spacing={2} mb={2}>
                            <Icon as={FiPlay} w={4} h={4} color="purple.500" />
                            <Text fontSize="sm" fontWeight="medium" color="purple.500">
                              Video Reference
                            </Text>
                          </HStack>
                          <HStack spacing={2}>
                            <Button
                              leftIcon={<Icon as={FiPlay} />}
                              size="xs"
                              variant="outline"
                              colorScheme="purple"
                              onClick={() => window.open(ticket.videoLink, '_blank')}
                            >
                              Watch
                            </Button>
                            <Button
                              leftIcon={<Icon as={FiCopy} />}
                              size="xs"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(ticket.videoLink || '');
                                // You might want to add a toast here
                              }}
                            >
                              Copy Link
                            </Button>
                          </HStack>
                        </Box>
                      )}

                      <Box fontSize="sm" color={textColor} maxH="120px" overflowY="auto">
                        <Box fontSize="sm" color={textColor}>
                          {ticket.description.split('\n').map((line, index) => {
                            // Handle structured format like "**What:** description"
                            if (line.includes('**What:**') || line.includes('**Why:**') || line.includes('**How:**')) {
                              const parts = line.split('**');
                              const label = parts[1]?.replace(':', '');
                              const description = parts[2]?.trim();
                              
                              return (
                                <Box key={index} mb={3}>
                                  <Text fontWeight="semibold" color="purple.600" fontSize="sm" mb={1}>
                                    {label}:
                                  </Text>
                                  <Text fontSize="sm" color={textColor} pl={2}>
                                    {description}
                                  </Text>
                                </Box>
                              );
                            }
                            
                            // Handle regular lines
                            if (line.trim()) {
                              return (
                                <Text key={index} mb={2} fontSize="sm" color={textColor}>
                                  {line}
                                </Text>
                              );
                            }
                            
                            return null;
                          })}
                        </Box>
                      </Box>

                      {ticket.estimatedTime && (
                        <HStack spacing={1}>
                          <Icon as={FiClock} w={3} h={3} color="gray.500" />
                          <Text fontSize="xs" color="gray.500">
                            {ticket.estimatedTime}
                          </Text>
                        </HStack>
                      )}

                      <HStack spacing={1}>
                        <Icon as={FiCalendar} w={3} h={3} color="gray.500" />
                        <Text fontSize="xs" color="gray.500">
                          {ticket.createdAt.toLocaleDateString()}
                        </Text>
                      </HStack>

                      {ticket.tags.length > 0 && (
                        <HStack spacing={1} wrap="wrap">
                          {ticket.tags.slice(0, 3).map((tag, index) => (
                            <Tag key={index} size="sm" colorScheme="purple" variant="subtle">
                              <TagLabel>{tag}</TagLabel>
                            </Tag>
                          ))}
                          {ticket.tags.length > 3 && (
                            <Text fontSize="xs" color="gray.500">
                              +{ticket.tags.length - 3} more
                            </Text>
                          )}
                        </HStack>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </Box>
    </Box>
  );
}

export default MyTicketsPage;
