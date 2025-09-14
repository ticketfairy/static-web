import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
};

const theme = extendTheme({
  config,
  colors: {
    purple: {
      50: '#f7f5ff',
      100: '#ede8ff',
      200: '#ddd4ff',
      300: '#c4b5ff',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'white',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
    }),
  },
  components: {
    Button: {
      variants: {
        solid: (props: any) => ({
          bg: props.colorScheme === 'purple' 
            ? (props.colorMode === 'dark' ? 'purple.600' : 'purple.500')
            : undefined,
          _hover: {
            bg: props.colorScheme === 'purple' 
              ? (props.colorMode === 'dark' ? 'purple.500' : 'purple.600')
              : undefined,
          },
        }),
      },
    },
  },
});

export default theme;