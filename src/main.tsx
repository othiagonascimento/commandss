import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PrivacyProvider } from "./contexts/PrivacyContext";

// PWA: detecta standalone e aplica classe no <html>
const detectStandalone = () => {
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
  document.documentElement.classList.toggle('standalone', isStandalone);
};
detectStandalone();
window.matchMedia('(display-mode: standalone)').addEventListener?.('change', detectStandalone);

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <PrivacyProvider>
      <App />
    </PrivacyProvider>
  </ThemeProvider>
);
