export type PlayerColor = "red" | "blue";
export type PieceType = "normal" | "bagel" | "pancake" | "bomb" | "vinyl" | "flying disk";

export enum GamePhase {
  Menu = "menu",
  Draft = "draft",
  Placement = "placement",
  Play = "play",
  GameOver = "gameOver"
}

export interface Square {
  row: number;
  col: number;
}

export interface Piece {
  id: string;
  type: PieceType;
  player: PlayerColor;
  crowned: boolean;
  position: Square;
}

export interface Move {
  piece: Piece;
  from: Square;
  to: Square;
  captured: Piece | null;
}

export interface WinResult {
  gameOver: boolean;
  winner: PlayerColor | null;
}

export interface GameState {
  phase: GamePhase;
  currentPlayer: PlayerColor;
  board: (Piece | null)[][];
  scores: Record<PlayerColor, number>;
  capturedPieces: Record<PlayerColor, Piece[]>;
  moveHistory: Move[];
  pieceCounts: Record<PlayerColor, number>;
  gameActive: boolean;
}

export interface PieceSelection {
  type: PieceType;
  count: number;
  max: number;
}

export interface CaptureResult {
  capturedPiece: Piece | null;
  capturedSquare: Square | null;
}
