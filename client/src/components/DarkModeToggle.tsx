import React from "react";
import { Box, IconButton, useColorMode, useColorModeValue, Tooltip } from "@chakra-ui/react";
import { FiSun, FiMoon } from "react-icons/fi";

export const DarkModeToggle: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const shadowColor = useColorModeValue("md", "dark-lg");

  return (
    <Box position="fixed" top={4} right={4} zIndex={1000}>
      <Tooltip label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}>
        <IconButton
          aria-label="Toggle color mode"
          icon={colorMode === "light" ? <FiMoon /> : <FiSun />}
          onClick={toggleColorMode}
          bg={bgColor}
          borderWidth="1px"
          borderColor={borderColor}
          shadow={shadowColor}
          _hover={{
            transform: "translateY(-2px)",
            shadow: "lg",
            borderColor: colorMode === "light" ? "purple.300" : "purple.400",
          }}
          _active={{
            transform: "translateY(0px)",
          }}
          transition="all 0.2s"
          size="md"
          borderRadius="lg"
        />
      </Tooltip>
    </Box>
  );
};