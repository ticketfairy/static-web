import { Box, Image } from "@chakra-ui/react";

interface TicketFairyButtonProps {
  onClick: () => void;
}

function TicketFairyButton({ onClick }: TicketFairyButtonProps) {
  return (
    <Box
      as="button"
      onClick={onClick}
      cursor="pointer"
      transition="all 0.2s ease-in-out"
      _hover={{
        transform: "scale(1.05)",
        filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.15))"
      }}
      _active={{
        transform: "scale(0.95)"
      }}
      bg="transparent"
      border="none"
      p={0}
      display="block"
    >
      <Image
        src="/ticket-fairy.png"
        alt="Ticket Fairy"
        w="200px"
        h="auto"
        objectFit="contain"
        fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiByeD0iMTIiIGZpbGw9IiNGNUU2RDMiLz4KPHRleHQgeD0iMTAwIiB5PSI0NSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMkQzNzQ4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5USUNLRVQgRkFJUlk8L3RleHQ+Cjwvc3ZnPgo="
      />
    </Box>
  );
}

export default TicketFairyButton;
