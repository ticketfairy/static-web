import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
};

const theme = extendTheme({
  config,
  colors: {
    // Custom brand colors that work well in both light and dark modes
    brand: {
      50: '#f7fafc',
      100: '#edf2f7',
      200: '#e2e8f0',
      300: '#cbd5e0',
      400: '#a0aec0',
      500: '#718096',
      600: '#4a5568',
      700: '#2d3748',
      800: '#1a202c',
      900: '#171923',
    },
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'white',
        color: props.colorMode === 'dark' ? 'gray.100' : 'gray.900',
      },
    }),
  },
  components: {
    // Enhanced button styles for dark mode
    Button: {
      variants: {
        solid: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'purple.600' : 'purple.500',
          color: 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? 'purple.700' : 'purple.600',
          },
        }),
        outline: (props: any) => ({
          borderColor: props.colorMode === 'dark' ? 'purple.400' : 'purple.500',
          color: props.colorMode === 'dark' ? 'purple.300' : 'purple.500',
          _hover: {
            bg: props.colorMode === 'dark' ? 'purple.800' : 'purple.50',
            borderColor: props.colorMode === 'dark' ? 'purple.300' : 'purple.600',
          },
        }),
      },
    },
    // Enhanced card/box styles for dark mode
    Box: {
      variants: {
        card: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
          borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.200',
          shadow: props.colorMode === 'dark' ? 'dark-lg' : 'lg',
        }),
      },
    },
    // Enhanced modal styles for dark mode
    Modal: {
      parts: ['dialog', 'header', 'body'],
      baseStyle: (props: any) => ({
        dialog: {
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
          color: props.colorMode === 'dark' ? 'gray.100' : 'gray.900',
        },
        header: {
          borderBottomColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.200',
        },
      }),
    },
  },
});

export default theme;