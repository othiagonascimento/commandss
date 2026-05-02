import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PrivacyProvider } from "./contexts/PrivacyContext";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <PrivacyProvider>
      <App />
    </PrivacyProvider>
  </ThemeProvider>
);
