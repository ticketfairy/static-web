import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider, ColorModeScript, extendTheme } from "@chakra-ui/react";
import "./index.css";
import App from "./App.tsx";

// Extend theme to customize initial color mode
const config = {
  initialColorMode: "light",
  useSystemColorMode: true,
};

const theme = extendTheme({ config });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </StrictMode>
);
