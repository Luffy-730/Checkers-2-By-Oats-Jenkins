import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { PieceType, PlayerColor, GamePhase, GameState, Piece, PieceSelection, Square } from "@/types/game";
import { isValidMove, checkWinCondition, handleCapture, getNormalMoves, getBagelMoves, getPancakeMoves } from "@/lib/gameLogic";

interface GameContextType {
  gameState: GameState;
  selectedPiece: Piece | null;
  validMoves: Square[];
  pieceSelections: {
    red: PieceSelection[];
    blue: PieceSelection[];
  };
  startGame: () => void;
  resetGame: () => void;
  finishDraft: () => void;
  finishPlacement: () => void;
  selectPiece: (piece: Piece) => void;
  deselectPiece: () => void;
  movePiece: (row: number, col: number) => void;
  togglePieceSelection: (player: PlayerColor, pieceType: PieceType, idx: number) => void;
  getValidMovesForPiece: (piece: Piece) => Square[];
  placePiece: (piece: Piece, row: number, col: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

// The maximum number of each piece type a player can select
const MAX_PIECE_COUNTS = {
  normal: 12,
  bagel: 6,
  pancake: 6
};

// Total pieces per player
const TOTAL_PIECES_PER_PLAYER = 12;

export const GameProvider = ({ children }: GameProviderProps) => {
  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.Menu,
    currentPlayer: "red",
    board: initializeEmptyBoard(),
    scores: { red: 0, blue: 0 },
    capturedPieces: { red: [], blue: [] },
    moveHistory: [],
    pieceCounts: { red: 0, blue: 0 },
    gameActive: false
  });

  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [pieceSelections, setPieceSelections] = useState<{
    red: PieceSelection[];
    blue: PieceSelection[];
  }>({
    red: [
      { type: "normal", count: 0, max: MAX_PIECE_COUNTS.normal },
      { type: "bagel", count: 0, max: MAX_PIECE_COUNTS.bagel },
      { type: "pancake", count: 0, max: MAX_PIECE_COUNTS.pancake }
    ],
    blue: [
      { type: "normal", count: 0, max: MAX_PIECE_COUNTS.normal },
      { type: "bagel", count: 0, max: MAX_PIECE_COUNTS.bagel },
      { type: "pancake", count: 0, max: MAX_PIECE_COUNTS.pancake }
    ]
  });

  function initializeEmptyBoard() {
    const board: (Piece | null)[][] = [];
    for (let row = 0; row < 8; row++) {
      board[row] = [];
      for (let col = 0; col < 8; col++) {
        board[row][col] = null;
      }
    }
    return board;
  }

  // This function prepares the board for the placement phase
  function setupBoardForPlacement() {
    const board = initializeEmptyBoard();
    return board;
  }
  
  // This function gets all valid initial placement squares for a player
  function getInitialPlacementSquares(player: PlayerColor): Square[] {
    const squares: Square[] = [];
    
    // Red pieces go in rows 0-2, blue pieces in rows 5-7
    const startRow = player === "red" ? 0 : 5;
    const endRow = player === "red" ? 3 : 8;
    
    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < 8; col++) {
        // Pieces can only go on dark squares (row+col is odd)
        if ((row + col) % 2 !== 0) {
          squares.push({ row, col });
        }
      }
    }
    
    return squares;
  }
  
  // Function for placing pieces is implemented below at line ~250
  
  function setupBoardWithSelectedPieces() {
    // In the future, this will be replaced with the player placement phase
    // For now, we'll automatically set up the board with random piece placements
    const board = initializeEmptyBoard();
    const redPieces = generatePiecesFromSelection("red");
    const bluePieces = generatePiecesFromSelection("blue");

    // Initialize red pieces (rows 0-2)
    let redPieceIndex = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        // Place pieces only on dark squares (row+col is odd)
        if ((row + col) % 2 !== 0 && redPieceIndex < redPieces.length) {
          // Set the correct position for each piece
          redPieces[redPieceIndex].position = { row, col };
          board[row][col] = redPieces[redPieceIndex];
          redPieceIndex++;
        }
      }
    }

    // Initialize blue pieces (rows 5-7)
    let bluePieceIndex = 0;
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        // Place pieces only on dark squares (row+col is odd)
        if ((row + col) % 2 !== 0 && bluePieceIndex < bluePieces.length) {
          // Set the correct position for each piece
          bluePieces[bluePieceIndex].position = { row, col };
          board[row][col] = bluePieces[bluePieceIndex];
          bluePieceIndex++;
        }
      }
    }

    return board;
  }

  function generatePiecesFromSelection(player: PlayerColor) {
    const pieces: Piece[] = [];
    const playerSelections = pieceSelections[player];

    // Add pieces based on selection counts
    playerSelections.forEach(selection => {
      for (let i = 0; i < selection.count; i++) {
        pieces.push({
          id: `${player}-${selection.type}-${i}`,
          type: selection.type,
          player,
          crowned: false,
          position: { row: 0, col: 0 } // This will be set when placing on board
        });
      }
    });

    return pieces;
  }

  const startGame = () => {
    setGameState({
      ...gameState,
      phase: GamePhase.Draft,
      currentPlayer: "red",
      scores: { red: 0, blue: 0 },
      capturedPieces: { red: [], blue: [] },
      moveHistory: [],
      pieceCounts: { red: 0, blue: 0 },
      gameActive: false
    });

    // Reset piece selections
    setPieceSelections({
      red: [
        { type: "normal", count: 0, max: MAX_PIECE_COUNTS.normal },
        { type: "bagel", count: 0, max: MAX_PIECE_COUNTS.bagel },
        { type: "pancake", count: 0, max: MAX_PIECE_COUNTS.pancake }
      ],
      blue: [
        { type: "normal", count: 0, max: MAX_PIECE_COUNTS.normal },
        { type: "bagel", count: 0, max: MAX_PIECE_COUNTS.bagel },
        { type: "pancake", count: 0, max: MAX_PIECE_COUNTS.pancake }
      ]
    });
  };

  const resetGame = () => {
    setGameState({
      phase: GamePhase.Menu,
      currentPlayer: "red",
      board: initializeEmptyBoard(),
      scores: { red: 0, blue: 0 },
      capturedPieces: { red: [], blue: [] },
      moveHistory: [],
      pieceCounts: { red: 0, blue: 0 },
      gameActive: false
    });
    setSelectedPiece(null);
    setValidMoves([]);
  };

  const finishDraft = () => {
    // Check if both players have selected exactly 12 pieces
    const redTotal = pieceSelections.red.reduce((sum, selection) => sum + selection.count, 0);
    const blueTotal = pieceSelections.blue.reduce((sum, selection) => sum + selection.count, 0);

    if (redTotal !== TOTAL_PIECES_PER_PLAYER || blueTotal !== TOTAL_PIECES_PER_PLAYER) {
      // Here we would normally show a toast notification
      console.error("Each player must select exactly 12 pieces");
      return;
    }

    // Instead of going directly to Play phase, now we go to Placement phase first
    const board = setupBoardForPlacement(); // Empty board for placement
    
    setGameState({
      ...gameState,
      phase: GamePhase.Placement,
      board,
      gameActive: true,
      pieceCounts: {
        red: redTotal,
        blue: blueTotal
      }
    });
  };
  
  // Function to handle placing a piece on the board during placement phase
  function placePiece(piece: Piece, row: number, col: number) {
    if (gameState.phase !== GamePhase.Placement) return;
    
    // Create a deep copy of the board
    const newBoard = gameState.board.map(boardRow => [...boardRow]);
    
    // Place the piece on the board
    const placedPiece = {
      ...piece,
      position: { row, col }
    };
    newBoard[row][col] = placedPiece;
    
    // Update the board state
    setGameState({
      ...gameState,
      board: newBoard
    });
  }
  
  // Function to handle the placement phase completion
  const finishPlacement = () => {
    // Switch to play phase with the current board state
    // In a full implementation, we would validate that all pieces are placed
    setGameState({
      ...gameState,
      phase: GamePhase.Play,
      currentPlayer: "red" // Red always goes first
    });
  };

  const selectPiece = (piece: Piece) => {
    if (piece.player !== gameState.currentPlayer || !gameState.gameActive) {
      return;
    }

    setSelectedPiece(piece);
    const moves = getValidMovesForPiece(piece);
    setValidMoves(moves);
  };

  const deselectPiece = () => {
    setSelectedPiece(null);
    setValidMoves([]);
  };

  const movePiece = (row: number, col: number) => {
    if (!selectedPiece || !gameState.gameActive) return;

    const { board, currentPlayer } = gameState;
    const pieceRow = selectedPiece.position.row;
    const pieceCol = selectedPiece.position.col;

    // Check if the move is valid
    if (!validMoves.some(move => move.row === row && move.col === col)) {
      return;
    }

    // Create a deep copy of the board
    const newBoard = board.map(boardRow => [...boardRow]);

    // Check for captures
    const captureResult = handleCapture(
      board,
      { row: pieceRow, col: pieceCol },
      { row, col },
      selectedPiece
    );
    
    // Update scores if a capture was made
    let newScores = { ...gameState.scores };
    let newCapturedPieces = { ...gameState.capturedPieces };
    
    if (captureResult.capturedPiece) {
      const opponent = currentPlayer === "red" ? "blue" : "red";
      newScores[currentPlayer] += 1;
      newCapturedPieces[currentPlayer] = [...newCapturedPieces[currentPlayer], captureResult.capturedPiece];
    }

    // Update the board with the move
    newBoard[pieceRow][pieceCol] = null;
    
    // Check for crowning
    let movedPiece = { ...selectedPiece, position: { row, col } };
    if ((currentPlayer === "red" && row === 7) || (currentPlayer === "blue" && row === 0)) {
      movedPiece.crowned = true;
    }
    
    newBoard[row][col] = movedPiece;

    // Save the move to history
    const newMoveHistory = [
      ...gameState.moveHistory,
      {
        piece: selectedPiece,
        from: { row: pieceRow, col: pieceCol },
        to: { row, col },
        captured: captureResult.capturedPiece
      }
    ];

    // Check for win condition
    const newPieceCounts = {
      red: gameState.pieceCounts.red - (currentPlayer === "blue" && captureResult.capturedPiece ? 1 : 0),
      blue: gameState.pieceCounts.blue - (currentPlayer === "red" && captureResult.capturedPiece ? 1 : 0)
    };

    const winResult = checkWinCondition(newBoard, newPieceCounts);

    let newPhase = gameState.phase;
    if (winResult.gameOver) {
      newPhase = GamePhase.GameOver;
    }

    // Switch player turn
    const nextPlayer = currentPlayer === "red" ? "blue" : "red";

    setGameState({
      ...gameState,
      board: newBoard,
      currentPlayer: nextPlayer,
      scores: newScores,
      capturedPieces: newCapturedPieces,
      moveHistory: newMoveHistory,
      pieceCounts: newPieceCounts,
      phase: newPhase
    });

    // Deselect the piece after moving
    deselectPiece();
  };

  const togglePieceSelection = (player: PlayerColor, pieceType: PieceType, idx: number) => {
    const newSelections = { ...pieceSelections };
    const selectionIndex = newSelections[player].findIndex(s => s.type === pieceType);
    
    // Check total pieces selected for this player
    const currentTotal = newSelections[player].reduce((sum, selection) => sum + selection.count, 0);
    
    // If we're increasing and already at max, don't allow
    if (newSelections[player][selectionIndex].count < newSelections[player][selectionIndex].max && 
        currentTotal < TOTAL_PIECES_PER_PLAYER) {
      newSelections[player][selectionIndex].count += 1;
    } 
    // If we're decreasing
    else if (newSelections[player][selectionIndex].count > 0) {
      newSelections[player][selectionIndex].count -= 1;
    }
    
    setPieceSelections(newSelections);
  };

  const getValidMovesForPiece = (piece: Piece): Square[] => {
    if (!piece) return [];
    
    const { board } = gameState;
    
    switch (piece.type) {
      case "normal":
        return getNormalMoves(board, piece);
      case "bagel":
        return getBagelMoves(board, piece, gameState.moveHistory);
      case "pancake":
        return getPancakeMoves(board, piece);
      default:
        return [];
    }
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        selectedPiece,
        validMoves,
        pieceSelections,
        startGame,
        resetGame,
        finishDraft,
        finishPlacement,
        selectPiece,
        deselectPiece,
        movePiece,
        togglePieceSelection,
        getValidMovesForPiece,
        placePiece
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
