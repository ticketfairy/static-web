import React from "react";
import {
  IconButton,
  useColorMode,
  useColorModeValue,
  Tooltip,
} from "@chakra-ui/react";
import { FiSun, FiMoon } from "react-icons/fi";

interface ThemeToggleProps {
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "solid" | "outline";
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = "md", 
  variant = "ghost" 
}) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue("gray.100", "gray.700");
  const hoverBg = useColorModeValue("gray.200", "gray.600");

  return (
    <Tooltip 
      label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}
      hasArrow
      placement="bottom"
    >
      <IconButton
        aria-label={`Toggle ${colorMode === "light" ? "dark" : "light"} mode`}
        icon={colorMode === "light" ? <FiMoon /> : <FiSun />}
        onClick={toggleColorMode}
        variant={variant}
        size={size}
        bg={variant === "solid" ? bg : undefined}
        _hover={{
          bg: hoverBg,
          transform: "scale(1.1)",
        }}
        _active={{
          transform: "scale(0.95)",
        }}
        transition="all 0.2s ease"
        borderRadius="full"
      />
    </Tooltip>
  );
};