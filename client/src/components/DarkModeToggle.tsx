import React from "react";
import { 
  Button, 
  useColorMode, 
  useColorModeValue, 
  Icon, 
  Tooltip 
} from "@chakra-ui/react";
import { FiSun, FiMoon } from "react-icons/fi";

export const DarkModeToggle: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === "dark";
  
  // Theme-aware styling
  const bgColor = useColorModeValue("white", "gray.800");
  const hoverBgColor = useColorModeValue("gray.100", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <Tooltip 
      label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      placement="bottom"
    >
      <Button
        onClick={toggleColorMode}
        variant="outline"
        size="md"
        bg={bgColor}
        borderColor={borderColor}
        _hover={{
          bg: hoverBgColor,
          transform: "translateY(-1px)",
          shadow: "md",
        }}
        _active={{
          transform: "translateY(0)",
          shadow: "sm",
        }}
        transition="all 0.2s"
        borderRadius="lg"
        minW="auto"
        h="40px"
        w="40px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Icon 
          as={isDark ? FiSun : FiMoon} 
          w={5} 
          h={5} 
          color={isDark ? "yellow.400" : "purple.500"}
        />
      </Button>
    </Tooltip>
  );
};