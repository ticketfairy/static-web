import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider, ColorModeScript, extendTheme } from "@chakra-ui/react";
import "./index.css";
import App from "./App.tsx";

// Extend the theme to enable color mode
const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
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
