import { GameState, Piece, PlayerColor, PieceType, Square, Move } from "@/types/game";
import { isValidMove, getNormalMoves, getBagelMoves, getPancakeMoves } from "./gameLogic";

// Helper function to get valid moves for a piece
function getValidMovesForPiece(piece: Piece, board: (Piece | null)[][]): Square[] {
  const validMoves: Square[] = [];
  
  // For each square on the board, check if the piece can move there
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const targetSquare: Square = { row, col };
      
      // Skip squares that already have a piece of the same player
      const targetPiece = board[row][col];
      if (targetPiece && targetPiece.player === piece.player) {
        continue;
      }
      
      // Check if this is a valid move for the piece
      if (isValidMove(board, piece.position, targetSquare, piece)) {
        validMoves.push(targetSquare);
      }
    }
  }
  
  return validMoves;
}

// AI difficulty levels
export enum AIDifficulty {
  Easy = "easy",
  Medium = "medium", 
  Hard = "hard"
}

// AI player interface
export interface AIPlayer {
  getNextMove(gameState: GameState): Promise<Move | null>;
  getDraftSelections(gameState: GameState): Promise<{ type: PieceType, count: number }[]>;
  getPlacementDecisions(gameState: GameState, availablePieces: Piece[]): Promise<{piece: Piece, position: Square}[]>;
}

// Base AI implementation with common functionality
class BaseAI implements AIPlayer {
  protected difficulty: AIDifficulty;
  protected playerColor: PlayerColor = "blue"; // AI is typically the second player (blue)
  
  constructor(difficulty: AIDifficulty) {
    this.difficulty = difficulty;
  }
  
  // Get next move based on current game state
  async getNextMove(gameState: GameState): Promise<Move | null> {
    // Ensure it's the AI's turn
    if (gameState.currentPlayer !== this.playerColor) {
      return null;
    }
    
    // Get all pieces that belong to the AI
    const aiPieces = this.getAIPieces(gameState);
    if (aiPieces.length === 0) return null;
    
    // Get all possible moves for all pieces
    const allPossibleMoves: {piece: Piece, move: Square}[] = [];
    
    for (const piece of aiPieces) {
      const validMoves = getValidMovesForPiece(piece, gameState.board);
      
      for (const move of validMoves) {
        allPossibleMoves.push({
          piece,
          move
        });
      }
    }
    
    if (allPossibleMoves.length === 0) return null;
    
    // Select a move based on difficulty
    const selectedMove = await this.selectMove(allPossibleMoves, gameState);
    
    if (!selectedMove) return null;
    
    return {
      piece: selectedMove.piece,
      from: selectedMove.piece.position,
      to: selectedMove.move,
      captured: null // This will be determined by the game engine
    };
  }
  
  // AI draft selections - what pieces to choose in draft phase
  async getDraftSelections(gameState: GameState): Promise<{ type: PieceType, count: number }[]> {
    // Default strategy - distribute points across different piece types
    // Advanced strategies implemented in difficulty-specific subclasses
    
    let selections: { type: PieceType, count: number }[] = [];
    
    // Basic distribution for all difficulty levels
    selections.push({ type: "normal", count: 6 });  // Free pieces
    selections.push({ type: "bagel", count: 2 });   // 1 power each = 2
    selections.push({ type: "vinyl", count: 2 });   // 2 power each = 4
    
    // Distribute remaining points based on difficulty
    if (this.difficulty === AIDifficulty.Easy) {
      selections.push({ type: "bomb", count: 1 });    // 3 power
      selections.push({ type: "pancake", count: 4 }); // 4 power each = 16
    } else if (this.difficulty === AIDifficulty.Medium) {
      selections.push({ type: "bomb", count: 2 });    // 3 power each = 6
      selections.push({ type: "pancake", count: 2 }); // 4 power each = 8
      selections.push({ type: "flying disk", count: 1 }); // 5 power
    } else { // Hard
      selections.push({ type: "bomb", count: 1 });    // 3 power
      selections.push({ type: "pancake", count: 1 }); // 4 power
      selections.push({ type: "flying disk", count: 2 }); // 5 power each = 10
    }
    
    return selections;
  }
  
  // AI placement decisions - where to place pieces on the board
  async getPlacementDecisions(
    gameState: GameState, 
    availablePieces: Piece[]
  ): Promise<{piece: Piece, position: Square}[]> {
    // Get valid placement squares for the AI
    const validSquares = this.getValidPlacementSquares();
    
    // Simple random placement strategy (will be improved in subclasses)
    const decisions: {piece: Piece, position: Square}[] = [];
    
    // Make a copy of the available pieces to work with
    const piecesToPlace = [...availablePieces];
    
    // Simple default placement strategy: place stronger pieces toward the center
    const centerColumns = [2, 3, 4, 5];
    const edgeColumns = [0, 1, 6, 7];
    
    // Sort pieces by type (more valuable pieces first)
    piecesToPlace.sort((a, b) => {
      const pieceValue = (type: PieceType): number => {
        switch(type) {
          case "flying disk": return 5;
          case "pancake": return 4;
          case "bomb": return 3;
          case "vinyl": return 2;
          case "bagel": return 1;
          case "normal": return 0;
          default: return 0;
        }
      };
      
      return pieceValue(b.type) - pieceValue(a.type);
    });
    
    // Filter valid squares by center vs edge
    const centerSquares = validSquares.filter(sq => centerColumns.includes(sq.col));
    const edgeSquares = validSquares.filter(sq => edgeColumns.includes(sq.col));
    
    // Start placing pieces, prioritizing center squares for valuable pieces
    let currentSquares = centerSquares.length > 0 ? centerSquares : edgeSquares;
    let squareIndex = 0;
    
    for (const piece of piecesToPlace) {
      // If we've used all center squares, switch to edge squares
      if (squareIndex >= currentSquares.length) {
        currentSquares = edgeSquares;
        squareIndex = 0;
        
        // If we've somehow used all squares, break (this shouldn't happen)
        if (currentSquares.length === 0) break;
      }
      
      decisions.push({
        piece,
        position: currentSquares[squareIndex]
      });
      
      squareIndex++;
    }
    
    return decisions;
  }
  
  // Get all pieces that belong to the AI
  protected getAIPieces(gameState: GameState): Piece[] {
    const aiPieces: Piece[] = [];
    
    for (let row = 0; row < gameState.board.length; row++) {
      for (let col = 0; col < gameState.board[row].length; col++) {
        const piece = gameState.board[row][col];
        if (piece && piece.player === this.playerColor) {
          aiPieces.push(piece);
        }
      }
    }
    
    return aiPieces;
  }
  
  // Get valid squares for initial piece placement
  protected getValidPlacementSquares(): Square[] {
    const validSquares: Square[] = [];
    
    // For blue player (AI), valid squares are dark squares in rows 5-7
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        // Dark squares have the property that (row + col) is odd
        if ((row + col) % 2 === 1) {
          validSquares.push({ row, col });
        }
      }
    }
    
    return validSquares;
  }
  
  // Select a move based on the AI difficulty
  protected async selectMove(
    possibleMoves: {piece: Piece, move: Square}[], 
    gameState: GameState
  ): Promise<{piece: Piece, move: Square} | null> {
    // Default implementation: random selection
    // Will be overridden by difficulty-specific implementations
    if (possibleMoves.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    return possibleMoves[randomIndex];
  }
}

// Easy AI - makes random moves
export class EasyAI extends BaseAI {
  constructor() {
    super(AIDifficulty.Easy);
  }
  
  // Random move selection
  protected async selectMove(
    possibleMoves: {piece: Piece, move: Square}[], 
    gameState: GameState
  ): Promise<{piece: Piece, move: Square} | null> {
    if (possibleMoves.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    return possibleMoves[randomIndex];
  }
}

// Medium AI - prefers capturing and safer moves
export class MediumAI extends BaseAI {
  constructor() {
    super(AIDifficulty.Medium);
  }
  
  // Prioritize captures and safe moves
  protected async selectMove(
    possibleMoves: {piece: Piece, move: Square}[], 
    gameState: GameState
  ): Promise<{piece: Piece, move: Square} | null> {
    if (possibleMoves.length === 0) return null;
    
    // Check for capturing moves
    const capturingMoves = possibleMoves.filter(moveObj => {
      const { piece, move } = moveObj;
      const dx = Math.abs(move.col - piece.position.col);
      
      // In checkers, a capture move typically jumps 2 squares
      return dx === 2;
    });
    
    // If we have captures, prioritize them
    if (capturingMoves.length > 0) {
      const randomIndex = Math.floor(Math.random() * capturingMoves.length);
      return capturingMoves[randomIndex];
    }
    
    // No captures, use regular move selection
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    return possibleMoves[randomIndex];
  }
}

// Hard AI - uses more sophisticated strategy
export class HardAI extends BaseAI {
  constructor() {
    super(AIDifficulty.Hard);
  }
  
  // More sophisticated move selection
  protected async selectMove(
    possibleMoves: {piece: Piece, move: Square}[], 
    gameState: GameState
  ): Promise<{piece: Piece, move: Square} | null> {
    if (possibleMoves.length === 0) return null;
    
    // Check for capturing moves
    const capturingMoves = possibleMoves.filter(moveObj => {
      const { piece, move } = moveObj;
      const dx = Math.abs(move.col - piece.position.col);
      
      // In checkers, a capture move typically jumps 2 squares
      return dx === 2;
    });
    
    // If we have captures, use them
    if (capturingMoves.length > 0) {
      // Sort by piece value (prioritize capturing with less valuable pieces)
      capturingMoves.sort((a, b) => {
        const getPieceValue = (type: PieceType): number => {
          switch (type) {
            case "flying disk": return 5;
            case "pancake": return 4;
            case "bomb": return 3;
            case "vinyl": return 2;
            case "bagel": return 1;
            case "normal": return 0;
            default: return 0;
          }
        };
        
        return getPieceValue(a.piece.type) - getPieceValue(b.piece.type);
      });
      
      return capturingMoves[0]; // Best capture move
    }
    
    // No captures available, prioritize:
    // 1. Moves toward opponent's side (crowning)
    // 2. Moves that develop center control
    // 3. Moves that protect valuable pieces
    
    // Prioritize forward moves for non-crowned pieces
    const forwardMoves = possibleMoves.filter(moveObj => {
      const { piece, move } = moveObj;
      // For blue AI, forward is decreasing row number
      return !piece.crowned && move.row < piece.position.row;
    });
    
    if (forwardMoves.length > 0) {
      // Prioritize moves toward crowning
      const crowningMoves = forwardMoves.filter(moveObj => moveObj.move.row === 0);
      if (crowningMoves.length > 0) {
        return crowningMoves[0];
      }
      
      // Prioritize center control
      const centerMoves = forwardMoves.filter(moveObj => {
        const col = moveObj.move.col;
        return col >= 2 && col <= 5;
      });
      
      if (centerMoves.length > 0) {
        return centerMoves[0];
      }
      
      // Use any forward move
      return forwardMoves[0];
    }
    
    // If no good strategy found, pick a reasonable move
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    return possibleMoves[randomIndex];
  }
  
  // Better draft selections for hard AI
  async getDraftSelections(gameState: GameState): Promise<{ type: PieceType, count: number }[]> {
    // Sophisticated selection with focus on powerful pieces
    return [
      { type: "normal", count: 5 },    // Free
      { type: "bagel", count: 1 },     // 1 power
      { type: "vinyl", count: 1 },     // 2 power
      { type: "bomb", count: 1 },      // 3 power
      { type: "pancake", count: 2 },   // 8 power total
      { type: "flying disk", count: 2 } // 10 power total
    ];
  }
  
  // More strategic placement for hard AI
  async getPlacementDecisions(
    gameState: GameState, 
    availablePieces: Piece[]
  ): Promise<{piece: Piece, position: Square}[]> {
    const validSquares = this.getValidPlacementSquares();
    const decisions: {piece: Piece, position: Square}[] = [];
    
    // Group pieces by type
    const piecesByType: Record<PieceType, Piece[]> = {
      "normal": [],
      "bagel": [],
      "pancake": [],
      "bomb": [],
      "vinyl": [],
      "flying disk": []
    };
    
    availablePieces.forEach(piece => {
      piecesByType[piece.type].push(piece);
    });
    
    // Center and edge squares
    const centerColumns = [2, 3, 4, 5];
    const edgeColumns = [0, 1, 6, 7];
    
    const centerSquares = validSquares.filter(sq => centerColumns.includes(sq.col));
    const edgeSquares = validSquares.filter(sq => edgeColumns.includes(sq.col));
    
    // Strategic placement:
    // 1. Flying disks on back row for maximum mobility
    // 2. Pancakes in center for offense/defense 
    // 3. Bombs at strategic positions to block advances
    // 4. Vinyl pieces at the sides as backup
    // 5. Bagels distributed for quick tactical options
    // 6. Normal pieces spread across remaining positions
    
    // Assign positions to each piece type
    let usedPositions: Square[] = [];
    
    // Function to get the next available position from a list
    const getNextPosition = (squares: Square[]): Square | null => {
      const available = squares.filter(sq => 
        !usedPositions.some(pos => pos.row === sq.row && pos.col === sq.col)
      );
      if (available.length === 0) return null;
      return available[0];
    };
    
    // Mark a position as used
    const markPositionUsed = (position: Square) => {
      usedPositions.push(position);
    };
    
    // Place flying disks in back row (row 7)
    const backRow = validSquares.filter(sq => sq.row === 7);
    for (const piece of piecesByType["flying disk"]) {
      const position = getNextPosition(backRow);
      if (position) {
        decisions.push({ piece, position });
        markPositionUsed(position);
      }
    }
    
    // Place pancakes in center
    for (const piece of piecesByType["pancake"]) {
      const position = getNextPosition(centerSquares);
      if (position) {
        decisions.push({ piece, position });
        markPositionUsed(position);
      }
    }
    
    // Place bombs at strategic positions (row 5, to block opponent advances)
    const frontRowSquares = validSquares.filter(sq => sq.row === 5);
    for (const piece of piecesByType["bomb"]) {
      const position = getNextPosition(frontRowSquares);
      if (position) {
        decisions.push({ piece, position });
        markPositionUsed(position);
      }
    }
    
    // Place vinyl pieces at edges
    for (const piece of piecesByType["vinyl"]) {
      const position = getNextPosition(edgeSquares);
      if (position) {
        decisions.push({ piece, position });
        markPositionUsed(position);
      }
    }
    
    // Place bagels distributed across the board
    for (const piece of piecesByType["bagel"]) {
      // Try to place in center first, then anywhere
      let position = getNextPosition(centerSquares);
      if (!position) {
        position = getNextPosition(validSquares);
      }
      
      if (position) {
        decisions.push({ piece, position });
        markPositionUsed(position);
      }
    }
    
    // Place normal pieces in remaining positions
    for (const piece of piecesByType["normal"]) {
      const position = getNextPosition(validSquares);
      if (position) {
        decisions.push({ piece, position });
        markPositionUsed(position);
      }
    }
    
    return decisions;
  }
}

// AI Factory to create the appropriate AI based on difficulty
export class AIFactory {
  static createAI(difficulty: AIDifficulty): AIPlayer {
    switch (difficulty) {
      case AIDifficulty.Easy:
        return new EasyAI();
      case AIDifficulty.Medium:
        return new MediumAI();
      case AIDifficulty.Hard:
        return new HardAI();
      default:
        return new EasyAI();
    }
  }
}