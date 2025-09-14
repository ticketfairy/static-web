import React from "react";
import { IconButton, useColorMode, useColorModeValue } from "@chakra-ui/react";
import { FiSun, FiMoon } from "react-icons/fi";

export const DarkModeToggle: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const SwitchIcon = useColorModeValue(FiMoon, FiSun);
  const bgColor = useColorModeValue("gray.100", "gray.700");
  const hoverColor = useColorModeValue("gray.200", "gray.600");

  return (
    <IconButton
      aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
      icon={<SwitchIcon />}
      onClick={toggleColorMode}
      variant="ghost"
      size="md"
      bg={bgColor}
      _hover={{
        bg: hoverColor,
        transform: "translateY(-1px)",
      }}
      _active={{
        transform: "translateY(0)",
      }}
      transition="all 0.2s"
      borderRadius="full"
      color={useColorModeValue("gray.700", "gray.200")}
      title={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
    />
  );
};