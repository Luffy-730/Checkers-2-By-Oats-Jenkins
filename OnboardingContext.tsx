import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Different steps of the onboarding process
export enum OnboardingStep {
  Welcome = 'welcome',
  GameRules = 'gameRules',
  DraftingExplained = 'draftingExplained',
  PiecesIntro = 'piecesIntro',
  PlacementExplained = 'placementExplained',
  GameplayBasics = 'gameplayBasics',
  SpecialMoves = 'specialMoves',
  Complete = 'complete',
}

// Data structure for each onboarding step
export interface OnboardingStepData {
  title: string;
  content: string[];
  mascotMood: MascotMood;
  mascotPosition: 'left' | 'right';
  animation?: string;
  actionText?: string;
}

// Mascot character moods for different expressions
export type MascotMood = 'happy' | 'excited' | 'thoughtful' | 'surprised' | 'pointing';

// Context type definition
interface OnboardingContextType {
  // Current state
  isOnboardingActive: boolean;
  currentStep: OnboardingStep | null;
  hasCompletedOnboarding: boolean;
  
  // Actions
  startOnboarding: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: OnboardingStep) => void;
  resetOnboarding: () => void;
  
  // Data access
  getCurrentStepData: () => OnboardingStepData | null;
  getTotalSteps: () => number;
  getCurrentStepNumber: () => number;
}

// Create the context
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Hook for using the onboarding context
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

// Props for the provider component
interface OnboardingProviderProps {
  children: ReactNode;
}

// The onboarding steps sequence
const ONBOARDING_STEPS = [
  OnboardingStep.Welcome,
  OnboardingStep.GameRules,
  OnboardingStep.DraftingExplained,
  OnboardingStep.PiecesIntro,
  OnboardingStep.PlacementExplained,
  OnboardingStep.GameplayBasics,
  OnboardingStep.SpecialMoves,
  OnboardingStep.Complete,
];

// Content for each onboarding step
const getStepData = (step: OnboardingStep): OnboardingStepData => {
  switch (step) {
    case OnboardingStep.Welcome:
      return {
        title: "Welcome to Battle Checkers!",
        content: [
          "Hi there! I'm Checky, your game guide!",
          "I'll help you learn how to play this awesome strategy game. It's like checkers, but with super cool special pieces!",
          "Ready to become a Battle Checkers master?"
        ],
        mascotMood: 'excited',
        mascotPosition: 'left',
        animation: 'bounce',
        actionText: "Let's Go!"
      };
      
    case OnboardingStep.GameRules:
      return {
        title: "Game Rules",
        content: [
          "Battle Checkers is a turn-based strategy game played on an 8x8 board.",
          "Your goal is to capture all your opponent's pieces or block them from making any moves.",
          "What makes this game special is that each piece has unique abilities that can change the course of the game!"
        ],
        mascotMood: 'thoughtful',
        mascotPosition: 'right',
        actionText: "Tell Me More!"
      };
      
    case OnboardingStep.DraftingExplained:
      return {
        title: "Drafting Your Pieces",
        content: [
          "Before the game starts, you'll draft your army of 12 pieces.",
          "You have 25 power points to spend on different types of pieces.",
          "Normal pieces are free, while special pieces cost more points depending on their abilities.",
          "Choose wisely to create a balanced team or focus on a specific strategy!"
        ],
        mascotMood: 'pointing',
        mascotPosition: 'left',
        actionText: "Got It!"
      };
      
    case OnboardingStep.PiecesIntro:
      return {
        title: "Special Pieces",
        content: [
          "There are six types of pieces in Battle Checkers:",
          "• Normal (0 pts): Moves like standard checkers pieces",
          "• Bagel (1 pt): Can capture by moving to where a piece was earlier",
          "• Vinyl (2 pts): Gets a second life when captured",
          "• Bomb (3 pts): Explodes when captured, affecting nearby pieces",
          "• Pancake (4 pts): Stacks captured pieces underneath",
          "• Flying Disk (5 pts): Moves unlimited distance diagonally"
        ],
        mascotMood: 'excited',
        mascotPosition: 'right',
        actionText: "Awesome!"
      };
      
    case OnboardingStep.PlacementExplained:
      return {
        title: "Placing Your Pieces",
        content: [
          "After drafting, you'll place your pieces on the board.",
          "Following checkers tradition, pieces must be placed on dark squares in your first three rows.",
          "But you get to decide which piece types go where!",
          "Your placement strategy can give you a big advantage from the start."
        ],
        mascotMood: 'thoughtful',
        mascotPosition: 'left',
        actionText: "I See!"
      };
      
    case OnboardingStep.GameplayBasics:
      return {
        title: "Playing the Game",
        content: [
          "On your turn, select one of your pieces and move it diagonally.",
          "If you can capture an opponent's piece by jumping over it, you must do so!",
          "Pieces that reach the opposite end of the board become 'crowned' and can move in any diagonal direction.",
          "Each piece type has special abilities that make gameplay more strategic and fun!"
        ],
        mascotMood: 'happy',
        mascotPosition: 'right',
        actionText: "Let's Play!"
      };
      
    case OnboardingStep.SpecialMoves:
      return {
        title: "Special Abilities",
        content: [
          "The special abilities of your pieces can create amazing combos and strategies:",
          "• Use Bagels to create surprise captures",
          "• Place Bombs strategically to threaten area damage",
          "• Stack captures with your Pancake to create a powerful unit",
          "• Control the board with long-range Flying Disks",
          "• Create resilient positions with Vinyl pieces that return after capture"
        ],
        mascotMood: 'surprised',
        mascotPosition: 'left',
        actionText: "I'm Ready!"
      };
      
    case OnboardingStep.Complete:
      return {
        title: "You're Ready to Play!",
        content: [
          "Great job! You now know the basics of Battle Checkers!",
          "Remember, I'm always here to help. You can access tutorials anytime from the game menu.",
          "Now go out there and show your strategic skills!",
          "Good luck and have fun!"
        ],
        mascotMood: 'excited',
        mascotPosition: 'right',
        animation: 'bounce',
        actionText: "Start Playing!"
      };
      
    default:
      return {
        title: "Battle Checkers",
        content: ["Let's play Battle Checkers!"],
        mascotMood: 'happy',
        mascotPosition: 'left'
      };
  }
};

// Onboarding Provider component
export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  // State
  const [isOnboardingActive, setIsOnboardingActive] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  
  // Load state from localStorage on mount
  useEffect(() => {
    const completedOnboarding = localStorage.getItem('hasCompletedOnboarding') === 'true';
    setHasCompletedOnboarding(completedOnboarding);
    
    // Auto-start onboarding for new users if not completed
    if (!completedOnboarding) {
      setIsOnboardingActive(true);
      setCurrentStep(OnboardingStep.Welcome);
    }
  }, []);
  
  // Save completion state to localStorage
  useEffect(() => {
    if (hasCompletedOnboarding) {
      localStorage.setItem('hasCompletedOnboarding', 'true');
    }
  }, [hasCompletedOnboarding]);
  
  // Start onboarding walkthrough
  const startOnboarding = () => {
    setIsOnboardingActive(true);
    setCurrentStep(OnboardingStep.Welcome);
  };
  
  // Skip onboarding completely
  const skipOnboarding = () => {
    setIsOnboardingActive(false);
    setCurrentStep(null);
    setHasCompletedOnboarding(true);
  };
  
  // Mark onboarding as complete
  const completeOnboarding = () => {
    setIsOnboardingActive(false);
    setCurrentStep(null);
    setHasCompletedOnboarding(true);
  };
  
  // Reset onboarding state (for testing or if user wants to see it again)
  const resetOnboarding = () => {
    setHasCompletedOnboarding(false);
    setIsOnboardingActive(false);
    setCurrentStep(null);
    localStorage.removeItem('hasCompletedOnboarding');
  };
  
  // Navigation functions
  const getCurrentStepIndex = () => {
    if (!currentStep) return -1;
    return ONBOARDING_STEPS.indexOf(currentStep);
  };
  
  const goToNextStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(ONBOARDING_STEPS[currentIndex + 1]);
    } else {
      completeOnboarding();
    }
  };
  
  const goToPreviousStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(ONBOARDING_STEPS[currentIndex - 1]);
    }
  };
  
  const goToStep = (step: OnboardingStep) => {
    if (ONBOARDING_STEPS.includes(step)) {
      setCurrentStep(step);
    }
  };
  
  // Data access functions
  const getCurrentStepData = (): OnboardingStepData | null => {
    if (!currentStep) return null;
    return getStepData(currentStep);
  };
  
  const getTotalSteps = (): number => {
    return ONBOARDING_STEPS.length;
  };
  
  const getCurrentStepNumber = (): number => {
    const index = getCurrentStepIndex();
    return index >= 0 ? index + 1 : 0;
  };
  
  // Context value
  const contextValue: OnboardingContextType = {
    isOnboardingActive,
    currentStep,
    hasCompletedOnboarding,
    startOnboarding,
    skipOnboarding,
    completeOnboarding,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    resetOnboarding,
    getCurrentStepData,
    getTotalSteps,
    getCurrentStepNumber
  };
  
  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
};