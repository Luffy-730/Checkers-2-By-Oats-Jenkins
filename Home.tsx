import { useState, useEffect } from "react";
import { GameBoard } from "@/components/GameBoard";
import { DraftPhase } from "@/components/DraftPhase";
import { PlacementPhase } from "@/components/PlacementPhase";
import { RulesModal } from "@/components/RulesModal";
import { VictoryModal } from "@/components/VictoryModal";
import { GameSidebar } from "@/components/GameSidebar";
import { MobileControls } from "@/components/MobileControls";
import { GameHeader } from "@/components/GameHeader";
import { LocalGameMode } from "@/components/LocalGameMode";
import { AIGameMode } from "@/components/AIGameMode";
import { useGame } from "@/contexts/GameContext";
import { GamePhase } from "@/types/game";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Users, Info, BookOpen } from "lucide-react";
import { OnboardingButton, MascotTip } from "@/components/OnboardingWalkthrough";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { MiniTutorialDemo } from "@/components/MiniTutorialDemo";

// Game Mode enum
enum GameMode {
  None = "none",
  Local = "local",
  AI = "ai",
  Online = "online"
}

export default function Home() {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.None);
  const { gameState, startGame, resetGame } = useGame();
  const { phase, currentPlayer } = gameState;
  const { startOnboarding, resetOnboarding } = useOnboarding();
  
  // State for mascot tips
  const [showDraftTip, setShowDraftTip] = useState(false);
  const [showPlacementTip, setShowPlacementTip] = useState(false);
  const [showGameplayTip, setShowGameplayTip] = useState(false);

  const showRules = () => setRulesOpen(true);
  const hideRules = () => setRulesOpen(false);

  const handlePlayAgain = () => {
    startGame();
  };

  const handleBackToMenu = () => {
    resetGame();
    setGameMode(GameMode.None);
  };
  
  // Show mascot tips when game phase changes
  useEffect(() => {
    if (gameMode === GameMode.Local || gameMode === GameMode.AI) {
      if (phase === GamePhase.Draft) {
        // Show draft tip after a small delay
        const timer = setTimeout(() => setShowDraftTip(true), 1000);
        return () => clearTimeout(timer);
      } else if (phase === GamePhase.Placement) {
        // Hide draft tip and show placement tip
        setShowDraftTip(false);
        const timer = setTimeout(() => setShowPlacementTip(true), 1000);
        return () => clearTimeout(timer);
      } else if (phase === GamePhase.Play) {
        // Hide placement tip and show gameplay tip
        setShowPlacementTip(false);
        const timer = setTimeout(() => setShowGameplayTip(true), 1000);
        return () => clearTimeout(timer);
      } else {
        // Hide all tips for other phases
        setShowDraftTip(false);
        setShowPlacementTip(false);
        setShowGameplayTip(false);
      }
    }
  }, [phase, gameMode]);

  // Render the game mode selection screen
  const renderGameModeSelection = () => {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-indigo-50 to-blue-100">
        <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Strategic Battle Board Game
        </h1>
        
        <p className="text-gray-700 mb-8 text-center max-w-md">
          A strategic board game combining character drafting with tactical gameplay. 
          Choose your game mode to begin!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
          {/* Local Game Mode Card */}
          <Card className="transition-all hover:shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-blue-500" />
                Local Game
              </CardTitle>
              <CardDescription>
                Play locally against a friend on the same device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Take turns with a friend using the same device. Great for learning the game!
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
                onClick={() => setGameMode(GameMode.Local)}
              >
                Play Local Game
              </Button>
            </CardFooter>
          </Card>
          
          {/* AI Game Mode Card */}
          <Card className="transition-all hover:shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Bot className="mr-2 h-5 w-5 text-purple-500" />
                Play vs AI
              </CardTitle>
              <CardDescription>
                Challenge the computer at different skill levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Play against AI opponents with different strategies and difficulties.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800"
                onClick={() => setGameMode(GameMode.AI)}
              >
                Play vs AI
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Button
            variant="outline"
            onClick={showRules}
          >
            <Info className="mr-2 h-4 w-4" />
            Game Rules
          </Button>
          
          <OnboardingButton 
            variant="outline"
            className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
          />
        </div>
        
        {/* Mini Tutorial Demo - only visible in development */}
        <div className="mt-8">
          <MiniTutorialDemo />
        </div>
      </div>
    );
  };

  // If no game mode is selected, show the game mode selection screen
  if (gameMode === GameMode.None) {
    return (
      <>
        {renderGameModeSelection()}
        <RulesModal isOpen={rulesOpen} onClose={hideRules} />
      </>
    );
  }

  // Render the appropriate game mode component
  return (
    <div className="min-h-screen flex flex-col md:flex-row p-4 gap-4 bg-gray-100 font-sans">
      {/* Game Header for Mobile */}
      {phase !== GamePhase.Menu && <GameHeader />}

      {/* Game Sidebar (Desktop) */}
      {gameMode === GameMode.Local && <GameSidebar onShowRules={showRules} />}

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col">
        {/* Render Draft and Placement Phases in local game mode (shared UI) */}
        {gameMode === GameMode.Local && phase === GamePhase.Draft && <DraftPhase />}
        {gameMode === GameMode.Local && phase === GamePhase.Placement && <PlacementPhase />}

        {/* Game Board for Local Mode (if not in AI or Online mode) */}
        {gameMode === GameMode.Local && phase === GamePhase.Play && <GameBoard />}

        {/* Mobile Controls for Local Mode */}
        {gameMode === GameMode.Local && (
          <MobileControls
            onStartGame={startGame}
            onShowRules={showRules}
            onResetGame={handleBackToMenu}
          />
        )}
      </main>

      {/* Game Rules Modal */}
      <RulesModal isOpen={rulesOpen} onClose={hideRules} />

      {/* Victory Modal for Local Mode */}
      {gameMode === GameMode.Local && (
        <VictoryModal
          isOpen={phase === GamePhase.GameOver}
          winner={phase === GamePhase.GameOver ? 
            (gameState.pieceCounts.red === 0 ? "blue" : 
            gameState.pieceCounts.blue === 0 ? "red" : null) : null}
          onPlayAgain={handlePlayAgain}
          onBackToMenu={handleBackToMenu}
        />
      )}
      
      {/* Local Game Mode Component */}
      {gameMode === GameMode.Local && <LocalGameMode />}
      
      {/* AI Game Mode Component */}
      {gameMode === GameMode.AI && <AIGameMode />}
      
      {/* Back to Menu Button for AI Mode */}
      {gameMode === GameMode.AI && phase === GamePhase.Menu && (
        <Button 
          className="absolute top-4 left-4"
          variant="outline"
          onClick={handleBackToMenu}
        >
          Back to Menu
        </Button>
      )}
      
      {/* Mascot Tips */}
      {showDraftTip && (
        <div className="fixed bottom-4 right-4 z-50">
          <MascotTip
            message="Time to draft your army! Choose your pieces wisely - each type has unique abilities!"
            mood="excited"
            position="right"
            onClose={() => setShowDraftTip(false)}
          />
        </div>
      )}
      
      {showPlacementTip && (
        <div className="fixed bottom-4 right-4 z-50">
          <MascotTip
            message="Now place your pieces on the dark squares in the first three rows. Think about your strategy!"
            mood="thoughtful"
            position="right" 
            onClose={() => setShowPlacementTip(false)}
          />
        </div>
      )}
      
      {showGameplayTip && (
        <div className="fixed bottom-4 right-4 z-50">
          <MascotTip
            message="Let the battle begin! Click on your pieces to move them. Remember, each piece type has special abilities!"
            mood="pointing"
            position="right"
            onClose={() => setShowGameplayTip(false)}
          />
        </div>
      )}
    </div>
  );
}
