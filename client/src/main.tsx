import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider, ColorModeScript, extendTheme } from "@chakra-ui/react";
import "./index.css";
import App from "./App.tsx";

// Extend the theme to include custom colors, fonts, etc
const theme = extendTheme({
  config: {
    initialColorMode: "light",
    useSystemColorMode: true,
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </StrictMode>
);
