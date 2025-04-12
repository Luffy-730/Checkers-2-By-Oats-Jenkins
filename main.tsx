import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { GameProvider } from "@/contexts/GameContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { MiniTutorialProvider } from "@/contexts/MiniTutorialContext";

// Add error handling for server connection issues
const handleConnectionError = (error: any) => {
  console.warn("Connection error encountered:", error);
  console.log("Game will continue in local-only mode");
  
  // Dispatch a custom event that our OfflineNotice component can listen for
  window.dispatchEvent(new CustomEvent('connection-error'));
};

// Add global error boundary
window.addEventListener('error', (event) => {
  if (event.message?.includes('fetch') || event.message?.includes('connect')) {
    handleConnectionError(event);
    event.preventDefault();
  }
});

// Also handle unhandled promise rejections (for fetch errors)
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('fetch') || 
      event.reason?.message?.includes('Failed to fetch') ||
      event.reason?.message?.includes('NetworkError')) {
    handleConnectionError(event.reason);
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <GameProvider>
      <TutorialProvider>
        <MiniTutorialProvider>
          <OnboardingProvider>
            <App />
          </OnboardingProvider>
        </MiniTutorialProvider>
      </TutorialProvider>
    </GameProvider>
  </QueryClientProvider>
);
