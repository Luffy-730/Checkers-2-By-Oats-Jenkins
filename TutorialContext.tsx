import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GamePhase, PieceType } from '@/types/game';

// Define all available tutorial types
export enum TutorialType {
  GameIntro = 'gameIntro',
  DraftPhase = 'draftPhase',
  PlacementPhase = 'placementPhase',
  GamePlay = 'gamePlay',
  PieceNormal = 'pieceNormal',
  PieceBagel = 'pieceBagel',
  PiecePancake = 'piecePancake', 
  PieceBomb = 'pieceBomb',
  PieceVinyl = 'pieceVinyl',
  PieceFlyingDisk = 'pieceFlyingDisk',
  CaptureMove = 'captureMove',
  CrownedPiece = 'crownedPiece',
  WinCondition = 'winCondition'
}

// Define the structure of tutorial content
interface TutorialContent {
  title: string;
  content: string[];
  image?: string;
}

// Define the Tutorial Context interface
interface TutorialContextType {
  // Current tutorial being displayed
  currentTutorial: TutorialType | null;
  // Whether tutorials are enabled
  tutorialsEnabled: boolean;
  // Whether to show the tutorial for the current game phase
  showPhaseTutorials: boolean;
  // Whether to show piece-specific tutorials
  showPieceTutorials: boolean;
  // Seen tutorials to avoid showing them repeatedly
  seenTutorials: Set<TutorialType>;
  // Functions to control tutorials
  showTutorial: (type: TutorialType) => void;
  hideTutorial: () => void;
  markTutorialSeen: (type: TutorialType) => void;
  resetSeenTutorials: () => void;
  enableTutorials: () => void;
  disableTutorials: () => void;
  togglePhaseTutorials: () => void;
  togglePieceTutorials: () => void;
  getTutorialContent: (type: TutorialType) => TutorialContent;
  showGamePhaseTutorial: (phase: GamePhase) => void;
  showPieceTutorial: (pieceType: PieceType) => void;
}

// Create the context with a default undefined value
const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

// Custom hook to use the tutorial context
export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

// Props for the provider component
interface TutorialProviderProps {
  children: ReactNode;
}

// Tutorial Provider component
export const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }): React.ReactNode => {
  // State for current tutorial and settings
  const [currentTutorial, setCurrentTutorial] = useState<TutorialType | null>(null);
  const [tutorialsEnabled, setTutorialsEnabled] = useState<boolean>(true);
  const [showPhaseTutorials, setShowPhaseTutorials] = useState<boolean>(true);
  const [showPieceTutorials, setShowPieceTutorials] = useState<boolean>(true);
  const [seenTutorials, setSeenTutorials] = useState<Set<TutorialType>>(new Set());

  // Load settings from localStorage on mount
  useEffect(() => {
    const storedSettings = localStorage.getItem('tutorialSettings');
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      setTutorialsEnabled(settings.tutorialsEnabled ?? true);
      setShowPhaseTutorials(settings.showPhaseTutorials ?? true);
      setShowPieceTutorials(settings.showPieceTutorials ?? true);
      
      // Convert array back to Set
      if (settings.seenTutorials) {
        setSeenTutorials(new Set(settings.seenTutorials));
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    const settings = {
      tutorialsEnabled,
      showPhaseTutorials,
      showPieceTutorials,
      seenTutorials: Array.from(seenTutorials)
    };
    localStorage.setItem('tutorialSettings', JSON.stringify(settings));
  }, [tutorialsEnabled, showPhaseTutorials, showPieceTutorials, seenTutorials]);

  // Function to show a tutorial
  const showTutorial = (type: TutorialType) => {
    if (tutorialsEnabled) {
      setCurrentTutorial(type);
    }
  };

  // Function to hide the current tutorial
  const hideTutorial = () => {
    setCurrentTutorial(null);
  };

  // Function to mark a tutorial as seen
  const markTutorialSeen = (type: TutorialType) => {
    setSeenTutorials(prev => {
      const newSet = new Set(prev);
      newSet.add(type);
      return newSet;
    });
  };

  // Function to reset seen tutorials
  const resetSeenTutorials = () => {
    setSeenTutorials(new Set());
  };

  // Functions to toggle settings
  const enableTutorials = () => setTutorialsEnabled(true);
  const disableTutorials = () => setTutorialsEnabled(false);
  const togglePhaseTutorials = () => setShowPhaseTutorials(prev => !prev);
  const togglePieceTutorials = () => setShowPieceTutorials(prev => !prev);

  // Function to get tutorial content based on type
  const getTutorialContent = (type: TutorialType): TutorialContent => {
    switch (type) {
      case TutorialType.GameIntro:
        return {
          title: "Welcome to Battle Checkers",
          content: [
            "In this strategic board game, you'll draft and place pieces with unique abilities and navigate them through a battlefield using strategy and foresight.",
            "The game combines the familiar mechanics of checkers with special piece abilities that create dynamic and engaging gameplay.",
            "You'll select 12 pieces per player in the draft phase, place them on the board, then take turns moving pieces to capture your opponent's forces.",
            "Are you ready to become a Battle Checkers champion?"
          ]
        };
      
      case TutorialType.DraftPhase:
        return {
          title: "Draft Phase",
          content: [
            "In the Draft Phase, each player selects exactly 12 pieces to play with.",
            "You can choose from different piece types, each with unique abilities:",
            "• Normal pieces move diagonally like traditional checkers pieces",
            "• Bagel pieces can capture by moving to a space a piece occupied earlier in the turn",
            "• Pancake pieces stack captured pieces underneath and only lose the bottom piece when jumped",
            "Choose your pieces wisely to create a balanced team that suits your strategy!"
          ]
        };
      
      case TutorialType.PlacementPhase:
        return {
          title: "Placement Phase",
          content: [
            "In the Placement Phase, you'll arrange your drafted pieces on the board.",
            "Following traditional checkers rules, pieces can only be placed on dark squares in the first three rows on your side of the board.",
            "Consider your placement strategy carefully:",
            "• Place your stronger pieces where they can be most effective",
            "• Protect valuable pieces with more expendable ones",
            "• Create formations that support your overall strategy",
            "Your initial placement will set the stage for your entire game!"
          ]
        };
      
      case TutorialType.GamePlay:
        return {
          title: "Game Play",
          content: [
            "During gameplay, you and your opponent will take turns moving your pieces.",
            "On your turn:",
            "1. Select one of your pieces",
            "2. Choose a valid move from the highlighted options",
            "3. If you can capture an opponent's piece, you must do so",
            "The game continues until one player has captured all of the opponent's pieces or no legal moves are available.",
            "Remember that each piece type has different movement and capture abilities!"
          ]
        };
      
      case TutorialType.PieceNormal:
        return {
          title: "Normal Piece",
          content: [
            "The Normal Piece is your standard checkers piece.",
            "Movement: Moves diagonally forward one square.",
            "Capture: Jumps diagonally over opponent's pieces to an empty square.",
            "When it reaches the opposite end of the board, it becomes \"crowned\" and can move diagonally in any direction.",
            "Cost: 0 power points - these are your basic pieces and form the foundation of your army."
          ]
        };
      
      case TutorialType.PieceBagel:
        return {
          title: "Bagel Piece",
          content: [
            "The Bagel is a unique piece with a special capture ability.",
            "Movement: Moves diagonally forward one square, like a normal piece.",
            "Special Capture: Can capture by moving to a square that was occupied by a piece earlier in the turn.",
            "This allows for interesting capture patterns that can surprise your opponent.",
            "Cost: 1 power point - an affordable special piece that adds tactical options to your game."
          ]
        };
      
      case TutorialType.PiecePancake:
        return {
          title: "Pancake Piece",
          content: [
            "The Pancake is a resilient piece that can absorb multiple captures.",
            "Movement: Moves diagonally forward one square.",
            "Special Ability: When it captures pieces, it stacks them underneath itself.",
            "When a Pancake is captured, it only loses the bottom piece in its stack, allowing it to survive multiple captures.",
            "Cost: 4 power points - expensive but durable, making it excellent for defensive strategies."
          ]
        };
      
      case TutorialType.PieceBomb:
        return {
          title: "Bomb Piece",
          content: [
            "The Bomb is a piece that causes area damage when captured.",
            "Movement: Moves diagonally forward one square.",
            "Special Ability: When captured, it explodes and destroys all pieces (both friendly and enemy) in a 1-square radius.",
            "This makes it a powerful deterrent and can be used to set up devastating traps.",
            "Cost: 3 power points - a moderately expensive piece that can create dramatic swings in the game."
          ]
        };
      
      case TutorialType.PieceVinyl:
        return {
          title: "Vinyl Piece",
          content: [
            "The Vinyl is a resilient piece that gets a second life.",
            "Movement: Moves diagonally forward one square.",
            "Special Ability: When captured, it gets a second life - becoming crowned and moving to the back row.",
            "This makes it difficult to permanently remove from the board.",
            "Cost: 2 power points - a moderate investment for a piece that can potentially last the entire game."
          ]
        };
      
      case TutorialType.PieceFlyingDisk:
        return {
          title: "Flying Disk Piece",
          content: [
            "The Flying Disk is a long-range specialist.",
            "Movement: Can move an unlimited distance diagonally, similar to a bishop in chess.",
            "Capture: Can capture one piece per move, regardless of distance traveled.",
            "This long-range movement makes it excellent for controlling large areas of the board.",
            "Cost: 5 power points - the most expensive piece, but with unmatched mobility."
          ]
        };
      
      case TutorialType.CaptureMove:
        return {
          title: "Capturing Pieces",
          content: [
            "Capturing is a key part of the game and follows these rules:",
            "• Normal captures: Jump diagonally over an opponent's piece to an empty square beyond",
            "• If a capture is available, you must take it",
            "• Chain captures: If after a capture, another capture is possible with the same piece, you must continue capturing",
            "• Special pieces may have unique capture abilities that override these rules",
            "Remember that only after completing a move are pieces removed from the board, which allows for chain captures and avoiding effects like bomb explosions."
          ]
        };
      
      case TutorialType.CrownedPiece:
        return {
          title: "Crowned Pieces",
          content: [
            "When a normal piece reaches the opposite end of the board, it becomes \"crowned\" (or \"kinged\").",
            "Crowned pieces gain the ability to move diagonally in any direction - both forward and backward.",
            "This makes them much more versatile and dangerous than regular pieces.",
            "Some special pieces may have different crowning abilities or may not receive additional benefits from being crowned.",
            "Protecting your crowned pieces while targeting your opponent's is often a key strategic consideration."
          ]
        };
      
      case TutorialType.WinCondition:
        return {
          title: "How to Win",
          content: [
            "There are two ways to win a game:",
            "1. Capture all of your opponent's pieces",
            "2. Put your opponent in a position where they have no legal moves",
            "The game will automatically detect when a win condition has been met and declare the winner.",
            "Remember that even a single crowned piece can sometimes turn the tide of a game, so don't give up too early!"
          ]
        };
      
      default:
        return {
          title: "Tutorial",
          content: ["Information not available for this tutorial type."]
        };
    }
  };

  // Function to show the appropriate tutorial for the current game phase
  const showGamePhaseTutorial = (phase: GamePhase) => {
    if (!tutorialsEnabled || !showPhaseTutorials) return;
    
    let tutorialType: TutorialType | null = null;
    
    switch (phase) {
      case 'draft':
        tutorialType = TutorialType.DraftPhase;
        break;
      case 'placement':
        tutorialType = TutorialType.PlacementPhase;
        break;
      case 'play':
        tutorialType = TutorialType.GamePlay;
        break;
      default:
        return;
    }
    
    // Only show if not seen before
    if (tutorialType && !seenTutorials.has(tutorialType)) {
      showTutorial(tutorialType);
    }
  };

  // Function to show the appropriate tutorial for a piece type
  const showPieceTutorial = (pieceType: PieceType) => {
    if (!tutorialsEnabled || !showPieceTutorials) return;
    
    let tutorialType: TutorialType | null = null;
    
    switch (pieceType) {
      case 'normal':
        tutorialType = TutorialType.PieceNormal;
        break;
      case 'bagel':
        tutorialType = TutorialType.PieceBagel;
        break;
      case 'pancake':
        tutorialType = TutorialType.PiecePancake;
        break;
      case 'bomb':
        tutorialType = TutorialType.PieceBomb;
        break;
      case 'vinyl':
        tutorialType = TutorialType.PieceVinyl;
        break;
      case 'flying disk':
        tutorialType = TutorialType.PieceFlyingDisk;
        break;
      default:
        return;
    }
    
    if (tutorialType) {
      showTutorial(tutorialType);
    }
  };

  // Value object for the context provider
  const contextValue: TutorialContextType = {
    currentTutorial,
    tutorialsEnabled,
    showPhaseTutorials,
    showPieceTutorials,
    seenTutorials,
    showTutorial,
    hideTutorial,
    markTutorialSeen,
    resetSeenTutorials,
    enableTutorials,
    disableTutorials,
    togglePhaseTutorials,
    togglePieceTutorials,
    getTutorialContent,
    showGamePhaseTutorial,
    showPieceTutorial
  };

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
    </TutorialContext.Provider>
  );
};