import React from "react";
import { IconButton, useColorMode, useColorModeValue } from "@chakra-ui/react";
import { FiSun, FiMoon } from "react-icons/fi";

export const DarkModeToggle: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const SwitchIcon = useColorModeValue(FiMoon, FiSun);
  const iconColor = useColorModeValue("gray.600", "yellow.400");

  return (
    <IconButton
      aria-label="Toggle dark mode"
      icon={<SwitchIcon />}
      onClick={toggleColorMode}
      variant="ghost"
      color={iconColor}
      fontSize="lg"
      _hover={{
        bg: useColorModeValue("gray.100", "gray.700"),
        transform: "scale(1.1)",
      }}
      _active={{
        transform: "scale(0.95)",
      }}
      transition="all 0.2s"
      title={colorMode === "light" ? "Switch to dark mode" : "Switch to light mode"}
    />
  );
};