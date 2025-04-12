import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useGame } from './GameContext';
import { useTutorial } from './TutorialContext';
import { PieceType, GamePhase, Piece, Move } from '@/types/game';

// The different mini-tutorial topics
export enum MiniTutorialTopic {
  // Gameplay mechanics
  FirstCapture = 'firstCapture',
  ChainCapture = 'chainCapture',
  KingPromotion = 'kingPromotion',
  
  // Special piece mechanics
  BagelCapture = 'bagelCapture',
  PancakeStack = 'pancakeStack',
  BombExplosion = 'bombExplosion',
  VinylRegeneration = 'vinylRegeneration',
  FlyingDiskMove = 'flyingDiskMove',
  
  // Strategy tips
  PieceProtection = 'pieceProtection',
  CornerStrategy = 'cornerStrategy',
  DefensiveFormation = 'defensiveFormation'
}

// Structure of a mini-tutorial
export interface MiniTutorial {
  topic: MiniTutorialTopic;
  title: string;
  content: string;
  icon?: React.ReactNode;
  duration?: number; // in milliseconds, defaults to 5000 (5 seconds)
}

// Interface for the context
interface MiniTutorialContextType {
  // Current state
  activeMiniTutorial: MiniTutorial | null;
  seenTutorials: Set<MiniTutorialTopic>;
  miniTutorialsEnabled: boolean;
  
  // Actions
  showMiniTutorial: (topic: MiniTutorialTopic) => void;
  dismissMiniTutorial: () => void;
  markAsSeen: (topic: MiniTutorialTopic) => void;
  resetSeenTutorials: () => void;
  enableMiniTutorials: () => void;
  disableMiniTutorials: () => void;
  
  // Game event handlers - these check game state and show tutorials when appropriate
  handleMove: (move: Move, piece: Piece) => void;
  handleCapture: (capturer: Piece, captured: Piece) => void;
  handlePromotion: (piece: Piece) => void;
  handlePieceSelection: (piece: Piece) => void;
}

// Create the context
const MiniTutorialContext = createContext<MiniTutorialContextType | undefined>(undefined);

// Hook for using the mini-tutorial context
export const useMiniTutorial = () => {
  const context = useContext(MiniTutorialContext);
  if (context === undefined) {
    throw new Error('useMiniTutorial must be used within a MiniTutorialProvider');
  }
  return context;
};

// Content for each mini-tutorial
const getMiniTutorialContent = (topic: MiniTutorialTopic): MiniTutorial => {
  switch (topic) {
    case MiniTutorialTopic.FirstCapture:
      return {
        topic,
        title: 'First Capture!',
        content: 'Great job! When you capture a piece, it is removed from the board. Look for more opportunities to capture!',
        duration: 4000
      };
      
    case MiniTutorialTopic.ChainCapture:
      return {
        topic,
        title: 'Chain Capture!',
        content: 'When a capture puts you in position to capture again, you must continue capturing with the same piece.',
        duration: 6000
      };
      
    case MiniTutorialTopic.KingPromotion:
      return {
        topic,
        title: 'Crowned!',
        content: 'Your piece reached the opposite end of the board and was crowned! Crowned pieces can move diagonally in any direction.',
        duration: 5000
      };
      
    case MiniTutorialTopic.BagelCapture:
      return {
        topic,
        title: 'Bagel Capture!',
        content: 'The Bagel piece can capture by moving to a space that was occupied by a piece earlier in the turn.',
        duration: 6000
      };
      
    case MiniTutorialTopic.PancakeStack:
      return {
        topic,
        title: 'Pancake Stack!',
        content: 'The Pancake piece stacks captured pieces underneath it. It only loses the bottom piece when captured.',
        duration: 6000
      };
      
    case MiniTutorialTopic.BombExplosion:
      return {
        topic,
        title: 'Bomb Explosion!',
        content: 'When a Bomb piece is captured, it explodes and destroys all pieces (both friendly and enemy) in a 1-square radius!',
        duration: 6000
      };
      
    case MiniTutorialTopic.VinylRegeneration:
      return {
        topic,
        title: 'Vinyl Regeneration!',
        content: 'When a Vinyl piece is captured, it gets a second life - becoming crowned and moving to the back row.',
        duration: 6000
      };
      
    case MiniTutorialTopic.FlyingDiskMove:
      return {
        topic,
        title: 'Flying Disk Range!',
        content: 'The Flying Disk can move an unlimited distance diagonally, similar to a bishop in chess.',
        duration: 5000
      };
      
    case MiniTutorialTopic.PieceProtection:
      return {
        topic,
        title: 'Strategic Tip',
        content: 'Protect your valuable pieces by keeping them near the edges or behind other pieces.',
        duration: 4000
      };
      
    case MiniTutorialTopic.CornerStrategy:
      return {
        topic,
        title: 'Corner Strategy',
        content: 'Pieces in corners can only be approached from one direction, making them safer from capture.',
        duration: 4000
      };
      
    case MiniTutorialTopic.DefensiveFormation:
      return {
        topic,
        title: 'Defensive Formation',
        content: 'Try to keep your pieces connected in defensive formations to support each other.',
        duration: 4000
      };
      
    default:
      return {
        topic,
        title: 'Game Tip',
        content: 'Keep practicing to improve your strategy!',
        duration: 3000
      };
  }
};

// Provider props
interface MiniTutorialProviderProps {
  children: ReactNode;
}

// Provider component
export const MiniTutorialProvider: React.FC<MiniTutorialProviderProps> = ({ children }) => {
  // State for the mini-tutorials
  const [activeMiniTutorial, setActiveMiniTutorial] = useState<MiniTutorial | null>(null);
  const [seenTutorials, setSeenTutorials] = useState<Set<MiniTutorialTopic>>(new Set());
  const [miniTutorialsEnabled, setMiniTutorialsEnabled] = useState<boolean>(true);
  
  // Auto-dismiss timer reference
  const dismissTimerRef = React.useRef<number | null>(null);
  
  // Access game state
  const { gameState } = useGame();
  
  // Access the main tutorial settings
  const { tutorialsEnabled } = useTutorial();
  
  // No need to expose MiniTutorialTopic, it's already exported as an enum
  
  // Load state from localStorage on mount
  useEffect(() => {
    const storedSettings = localStorage.getItem('miniTutorialSettings');
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      setMiniTutorialsEnabled(settings.miniTutorialsEnabled ?? true);
      
      // Convert array back to Set
      if (settings.seenTutorials) {
        setSeenTutorials(new Set(settings.seenTutorials));
      }
    }
  }, []);
  
  // Save state to localStorage when it changes
  useEffect(() => {
    const settings = {
      miniTutorialsEnabled,
      seenTutorials: Array.from(seenTutorials)
    };
    localStorage.setItem('miniTutorialSettings', JSON.stringify(settings));
  }, [miniTutorialsEnabled, seenTutorials]);
  
  // Show a mini-tutorial
  const showMiniTutorial = (topic: MiniTutorialTopic) => {
    // Only show if tutorials are enabled and this specific topic hasn't been seen yet
    if (tutorialsEnabled && miniTutorialsEnabled && !seenTutorials.has(topic)) {
      // Clear any existing dismiss timer
      if (dismissTimerRef.current) {
        window.clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      
      // Get the tutorial content and show it
      const tutorial = getMiniTutorialContent(topic);
      setActiveMiniTutorial(tutorial);
      
      // Set up auto-dismiss timer
      dismissTimerRef.current = window.setTimeout(() => {
        setActiveMiniTutorial(null);
        dismissTimerRef.current = null;
      }, tutorial.duration || 5000);
      
      // Mark as seen
      markAsSeen(topic);
    }
  };
  
  // Manually dismiss the active mini-tutorial
  const dismissMiniTutorial = () => {
    if (dismissTimerRef.current) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setActiveMiniTutorial(null);
  };
  
  // Mark a tutorial topic as seen
  const markAsSeen = (topic: MiniTutorialTopic) => {
    setSeenTutorials(prev => {
      const newSet = new Set(prev);
      newSet.add(topic);
      return newSet;
    });
  };
  
  // Reset seen tutorials
  const resetSeenTutorials = () => {
    setSeenTutorials(new Set());
  };
  
  // Enable/disable mini-tutorials
  const enableMiniTutorials = () => setMiniTutorialsEnabled(true);
  const disableMiniTutorials = () => setMiniTutorialsEnabled(false);
  
  // Game event handlers
  
  // Handle move events
  const handleMove = (move: Move, piece: Piece) => {
    // Check for specific piece type tutorials
    if (piece.type === 'flying disk' && !seenTutorials.has(MiniTutorialTopic.FlyingDiskMove)) {
      showMiniTutorial(MiniTutorialTopic.FlyingDiskMove);
    }
    
    // Strategic tips - show occasionally
    if (gameState.moveHistory.length === 10) {
      showMiniTutorial(MiniTutorialTopic.PieceProtection);
    } else if (gameState.moveHistory.length === 20) {
      showMiniTutorial(MiniTutorialTopic.DefensiveFormation);
    }
  };
  
  // Handle capture events
  const handleCapture = (capturer: Piece, captured: Piece) => {
    // First capture
    if (gameState.capturedPieces.red.length + gameState.capturedPieces.blue.length === 1) {
      showMiniTutorial(MiniTutorialTopic.FirstCapture);
    }
    
    // Check for multiple captures in a row (chain capture)
    const moveHistory = gameState.moveHistory;
    if (moveHistory.length >= 2) {
      const lastMove = moveHistory[moveHistory.length - 1];
      const secondLastMove = moveHistory[moveHistory.length - 2];
      
      if (lastMove.piece.player === secondLastMove.piece.player && 
          lastMove.from.row === secondLastMove.to.row && 
          lastMove.from.col === secondLastMove.to.col) {
        showMiniTutorial(MiniTutorialTopic.ChainCapture);
      }
    }
    
    // Special piece captures
    if (capturer.type === 'bagel') {
      showMiniTutorial(MiniTutorialTopic.BagelCapture);
    } else if (capturer.type === 'pancake') {
      showMiniTutorial(MiniTutorialTopic.PancakeStack);
    }
    
    if (captured.type === 'bomb') {
      showMiniTutorial(MiniTutorialTopic.BombExplosion);
    } else if (captured.type === 'vinyl') {
      showMiniTutorial(MiniTutorialTopic.VinylRegeneration);
    }
  };
  
  // Handle promotion events (when a piece becomes crowned)
  const handlePromotion = (piece: Piece) => {
    showMiniTutorial(MiniTutorialTopic.KingPromotion);
  };
  
  // Handle piece selection events
  const handlePieceSelection = (piece: Piece) => {
    // Show specific tutorials for piece types when selected
    if (piece.type === 'flying disk' && !seenTutorials.has(MiniTutorialTopic.FlyingDiskMove)) {
      showMiniTutorial(MiniTutorialTopic.FlyingDiskMove);
    } else if (piece.type === 'bagel' && !seenTutorials.has(MiniTutorialTopic.BagelCapture)) {
      showMiniTutorial(MiniTutorialTopic.BagelCapture);
    } else if (piece.type === 'pancake' && !seenTutorials.has(MiniTutorialTopic.PancakeStack)) {
      showMiniTutorial(MiniTutorialTopic.PancakeStack);
    } else if (piece.type === 'bomb' && !seenTutorials.has(MiniTutorialTopic.BombExplosion)) {
      showMiniTutorial(MiniTutorialTopic.BombExplosion);
    } else if (piece.type === 'vinyl' && !seenTutorials.has(MiniTutorialTopic.VinylRegeneration)) {
      showMiniTutorial(MiniTutorialTopic.VinylRegeneration);
    }
  };
  
  // Clean up any timers on unmount
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        window.clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);
  
  // Context value
  const contextValue: MiniTutorialContextType = {
    activeMiniTutorial,
    seenTutorials,
    miniTutorialsEnabled,
    showMiniTutorial,
    dismissMiniTutorial,
    markAsSeen,
    resetSeenTutorials,
    enableMiniTutorials,
    disableMiniTutorials,
    handleMove,
    handleCapture,
    handlePromotion,
    handlePieceSelection
  };
  
  return (
    <MiniTutorialContext.Provider value={contextValue}>
      {children}
    </MiniTutorialContext.Provider>
  );
};