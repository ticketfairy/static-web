import React from "react";
import { IconButton, useColorMode, useColorModeValue, Tooltip } from "@chakra-ui/react";
import { FiSun, FiMoon } from "react-icons/fi";

interface DarkModeToggleProps {
  size?: "sm" | "md" | "lg";
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ size = "md" }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue("white", "gray.700");
  const hoverBgColor = useColorModeValue("gray.100", "gray.600");
  const iconColor = useColorModeValue("gray.600", "yellow.300");

  return (
    <Tooltip
      label={colorMode === "light" ? "Switch to dark mode" : "Switch to light mode"}
      aria-label="Toggle color mode"
      placement="bottom"
    >
      <IconButton
        aria-label="Toggle dark mode"
        icon={colorMode === "light" ? <FiMoon /> : <FiSun />}
        onClick={toggleColorMode}
        size={size}
        variant="ghost"
        color={iconColor}
        bg={bgColor}
        _hover={{
          bg: hoverBgColor,
        }}
        borderRadius="full"
        transition="all 0.2s"
      />
    </Tooltip>
  );
};

export default DarkModeToggle;