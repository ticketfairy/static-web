import React from "react";
import { IconButton, useColorMode, useColorModeValue } from "@chakra-ui/react";
import { FiSun, FiMoon } from "react-icons/fi";

export const ThemeToggle: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const SwitchIcon = useColorModeValue(FiMoon, FiSun);
  const iconColor = useColorModeValue("gray.600", "gray.300");

  return (
    <IconButton
      aria-label="Toggle theme"
      icon={<SwitchIcon />}
      onClick={toggleColorMode}
      variant="ghost"
      color={iconColor}
      fontSize="18px"
      _hover={{
        bg: useColorModeValue("gray.100", "gray.700"),
        transform: "scale(1.1)",
      }}
      transition="all 0.2s"
      title={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}
    />
  );
};