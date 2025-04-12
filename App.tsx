import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { GameProvider } from "@/contexts/GameContext";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { TutorialModal } from "@/components/TutorialModal";
import { TutorialTrigger } from "@/components/TutorialTrigger";
import { OfflineNotice } from "@/components/OfflineNotice";
import { OnboardingWalkthrough } from "@/components/OnboardingWalkthrough";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { MiniTutorial } from "@/components/MiniTutorial";
import { MiniTutorialProvider } from "@/contexts/MiniTutorialContext";
import { MiniTutorialDisplay } from "@/components/MiniTutorialDisplay";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <OfflineNotice />
      <TutorialModal />
      <TutorialTrigger />
      <OnboardingWalkthrough />
      <MiniTutorial />
      <MiniTutorialDisplay />
      <Toaster />
    </>
  );
}

export default App;
