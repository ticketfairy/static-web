import { IconButton, useColorMode, useColorModeValue } from "@chakra-ui/react";
import { FiMoon, FiSun } from "react-icons/fi";

export const ThemeToggle: React.FC = () => {
  const { toggleColorMode } = useColorMode();
  const SwitchIcon = useColorModeValue(FiMoon, FiSun);
  const iconLabel = useColorModeValue("Switch to dark mode", "Switch to light mode");

  return (
    <IconButton
      aria-label={iconLabel}
      icon={<SwitchIcon />}
      onClick={toggleColorMode}
      variant="ghost"
      size="md"
      borderRadius="lg"
      _hover={{
        bg: useColorModeValue("gray.100", "gray.700"),
      }}
      color={useColorModeValue("gray.700", "gray.200")}
    />
  );
};