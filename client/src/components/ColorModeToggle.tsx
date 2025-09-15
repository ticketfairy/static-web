import React from "react";
import { 
  IconButton, 
  useColorMode, 
  useColorModeValue, 
  Tooltip 
} from "@chakra-ui/react";
import { FiSun, FiMoon } from "react-icons/fi";

export const ColorModeToggle: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const SwitchIcon = useColorModeValue(FiMoon, FiSun);
  const iconColor = useColorModeValue("gray.600", "gray.400");
  const hoverBg = useColorModeValue("gray.100", "gray.700");

  return (
    <Tooltip 
      label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}
      placement="bottom"
    >
      <IconButton
        aria-label="Toggle color mode"
        icon={<SwitchIcon />}
        onClick={toggleColorMode}
        variant="ghost"
        size="md"
        color={iconColor}
        _hover={{
          bg: hoverBg,
        }}
        transition="all 0.2s ease"
      />
    </Tooltip>
  );
};