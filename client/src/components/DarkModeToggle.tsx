import React from "react";
import { IconButton, useColorMode, useColorModeValue } from "@chakra-ui/react";
import { FiSun, FiMoon } from "react-icons/fi";

export const DarkModeToggle: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const icon = useColorModeValue(FiMoon, FiSun);
  const bgColor = useColorModeValue("gray.100", "gray.700");
  const hoverBgColor = useColorModeValue("gray.200", "gray.600");

  return (
    <IconButton
      aria-label="Toggle dark mode"
      icon={React.createElement(icon)}
      onClick={toggleColorMode}
      variant="ghost"
      size="md"
      bg={bgColor}
      _hover={{
        bg: hoverBgColor,
      }}
      borderRadius="lg"
      title={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}
    />
  );
};