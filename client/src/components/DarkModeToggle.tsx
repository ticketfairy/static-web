import React from 'react';
import {
  IconButton,
  useColorMode,
  useColorModeValue,
  Tooltip,
} from '@chakra-ui/react';
import { FiSun, FiMoon } from 'react-icons/fi';

const DarkModeToggle: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('gray.100', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Tooltip 
      label={colorMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label="Toggle color mode tooltip"
    >
      <IconButton
        aria-label={colorMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
        onClick={toggleColorMode}
        variant="ghost"
        size="md"
        bg={bgColor}
        _hover={{
          bg: hoverBgColor,
          transform: 'translateY(-1px)',
        }}
        transition="all 0.2s"
        borderRadius="full"
      />
    </Tooltip>
  );
};

export default DarkModeToggle;