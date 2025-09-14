import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

// Configure color mode settings
const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false, // Set to true if you want to respect system preference
};

// Extend the theme
const theme = extendTheme({
  config,
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === "dark" ? "gray.900" : "white",
        color: props.colorMode === "dark" ? "gray.100" : "gray.900",
      },
    }),
  },
});

export default theme;