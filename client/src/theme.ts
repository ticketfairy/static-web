import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

// Define the theme configuration
const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

// Define color palette for both modes
const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: "#f7fafc",
      100: "#edf2f7",
      200: "#e2e8f0",
      300: "#cbd5e0",
      400: "#a0aec0",
      500: "#718096",
      600: "#4a5568",
      700: "#2d3748",
      800: "#1a202c",
      900: "#171923",
    },
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === "dark" ? "gray.900" : "white",
        color: props.colorMode === "dark" ? "gray.100" : "gray.800",
      },
    }),
  },
});

export default theme;