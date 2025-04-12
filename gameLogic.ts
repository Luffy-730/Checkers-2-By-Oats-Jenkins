import { Piece, Square, Move, CaptureResult, WinResult, PlayerColor } from "@/types/game";

export function isValidMove(
  board: (Piece | null)[][],
  from: Square,
  to: Square,
  piece: Piece
): boolean {
  // Check if destination is empty
  if (board[to.row][to.col] !== null) {
    return false;
  }

  // Check if destination is within board bounds
  if (to.row < 0 || to.row > 7 || to.col < 0 || to.col > 7) {
    return false;
  }

  // For different piece types, apply different move validation logic
  switch (piece.type) {
    case "normal":
      return isValidNormalMove(board, from, to, piece);
    case "bagel":
      return isValidBagelMove(board, from, to, piece);
    case "pancake":
      return isValidPancakeMove(board, from, to, piece);
    default:
      return false;
  }
}

export function getNormalMoves(
  board: (Piece | null)[][],
  piece: Piece
): Square[] {
  const moves: Square[] = [];
  const { row, col } = piece.position;
  const direction = piece.player === "red" ? 1 : -1;
  
  // Regular diagonal moves
  const diagonalMoves = [
    { row: row + direction, col: col - 1 },
    { row: row + direction, col: col + 1 }
  ];

  // If crowned, can also move backward
  if (piece.crowned) {
    diagonalMoves.push(
      { row: row - direction, col: col - 1 },
      { row: row - direction, col: col + 1 }
    );
  }

  // Check each potential move
  for (const move of diagonalMoves) {
    if (
      move.row >= 0 && move.row < 8 && move.col >= 0 && move.col < 8 &&
      board[move.row][move.col] === null
    ) {
      moves.push(move);
    }
  }

  // Capture moves
  const captureMoves = [
    { midRow: row + direction, midCol: col - 1, endRow: row + 2 * direction, endCol: col - 2 },
    { midRow: row + direction, midCol: col + 1, endRow: row + 2 * direction, endCol: col + 2 }
  ];

  // If crowned, can also capture backward
  if (piece.crowned) {
    captureMoves.push(
      { midRow: row - direction, midCol: col - 1, endRow: row - 2 * direction, endCol: col - 2 },
      { midRow: row - direction, midCol: col + 1, endRow: row - 2 * direction, endCol: col + 2 }
    );
  }

  // Check each potential capture
  for (const move of captureMoves) {
    if (
      move.endRow >= 0 && move.endRow < 8 && move.endCol >= 0 && move.endCol < 8 &&
      board[move.midRow][move.midCol] !== null &&
      board[move.midRow][move.midCol]?.player !== piece.player &&
      board[move.endRow][move.endCol] === null
    ) {
      moves.push({ row: move.endRow, col: move.endCol });
    }
  }

  return moves;
}

export function getBagelMoves(
  board: (Piece | null)[][],
  piece: Piece,
  moveHistory: Move[]
): Square[] {
  // Bagel pieces can move like normal pieces but capture differently
  const normalMoves = getNormalMoves(board, piece);
  
  // Add special capture moves for bagel
  // A bagel can capture by landing on the square where an opponent piece was before it moved
  const specialMoves: Square[] = [];
  
  // Check recent moves in the history for opponent pieces
  // For simplicity, we'll just look at the last move
  if (moveHistory.length > 0) {
    const lastMove = moveHistory[moveHistory.length - 1];
    if (lastMove.piece.player !== piece.player) {
      // Check if we can reach the 'from' position of the last move
      const targetSquare = lastMove.from;
      
      // Check if it's a valid move (diagonal and empty)
      if (isValidDiagonalMove(piece.position, targetSquare, piece.crowned, piece.player) && 
          board[targetSquare.row][targetSquare.col] === null) {
        specialMoves.push(targetSquare);
      }
    }
  }
  
  return [...normalMoves, ...specialMoves];
}

export function getPancakeMoves(
  board: (Piece | null)[][],
  piece: Piece
): Square[] {
  const moves: Square[] = [];
  const { row, col } = piece.position;
  
  // Pancake can move like a normal piece but also has extra movement patterns
  // For simplicity in this implementation, pancake can also move horizontally
  const possibleMoves = [
    // Normal checkers moves
    { row: row + 1, col: col + 1 },
    { row: row + 1, col: col - 1 },
    { row: row - 1, col: col + 1 },
    { row: row - 1, col: col - 1 },
    // Special pancake moves (horizontal)
    { row: row, col: col + 1 },
    { row: row, col: col - 1 }
  ];
  
  // Filter valid moves
  for (const move of possibleMoves) {
    if (
      move.row >= 0 && move.row < 8 && move.col >= 0 && move.col < 8 &&
      board[move.row][move.col] === null
    ) {
      moves.push(move);
    }
  }
  
  // Pancake capture moves - can capture in more directions
  const captureDirections = [
    // Diagonal captures
    { midRow: row + 1, midCol: col + 1, endRow: row + 2, endCol: col + 2 },
    { midRow: row + 1, midCol: col - 1, endRow: row + 2, endCol: col - 2 },
    { midRow: row - 1, midCol: col + 1, endRow: row - 2, endCol: col + 2 },
    { midRow: row - 1, midCol: col - 1, endRow: row - 2, endCol: col - 2 },
    // Horizontal captures
    { midRow: row, midCol: col + 1, endRow: row, endCol: col + 2 },
    { midRow: row, midCol: col - 1, endRow: row, endCol: col - 2 }
  ];
  
  for (const cap of captureDirections) {
    if (
      cap.endRow >= 0 && cap.endRow < 8 && cap.endCol >= 0 && cap.endCol < 8 &&
      board[cap.midRow][cap.midCol] !== null &&
      board[cap.midRow][cap.midCol]?.player !== piece.player &&
      board[cap.endRow][cap.endCol] === null
    ) {
      moves.push({ row: cap.endRow, col: cap.endCol });
    }
  }
  
  return moves;
}

function isValidNormalMove(
  board: (Piece | null)[][],
  from: Square,
  to: Square,
  piece: Piece
): boolean {
  const rowDiff = to.row - from.row;
  const colDiff = to.col - from.col;
  const absRowDiff = Math.abs(rowDiff);
  const absColDiff = Math.abs(colDiff);
  
  // Direction the piece is allowed to move (forward for normal, both for crowned)
  const isForwardMove = (piece.player === "red" && rowDiff > 0) || 
                        (piece.player === "blue" && rowDiff < 0);
  
  // Regular move (1 square diagonally)
  if (absRowDiff === 1 && absColDiff === 1) {
    return piece.crowned || isForwardMove;
  }
  
  // Capture move (2 squares diagonally)
  if (absRowDiff === 2 && absColDiff === 2) {
    // Check if there's an opponent piece in between
    const midRow = from.row + rowDiff / 2;
    const midCol = from.col + colDiff / 2;
    const midPiece = board[midRow][midCol];
    
    return (piece.crowned || isForwardMove) && 
           midPiece !== null && 
           midPiece.player !== piece.player;
  }
  
  return false;
}

function isValidBagelMove(
  board: (Piece | null)[][],
  from: Square,
  to: Square,
  piece: Piece
): boolean {
  // Bagel moves like a normal piece for regular moves
  if (isValidNormalMove(board, from, to, piece)) {
    return true;
  }
  
  // Bagel has special capture logic, but for now, we'll implement the same as normal
  // In a real implementation, you'd check the move history and allow landing on positions
  // where pieces were previously captured
  return false;
}

function isValidPancakeMove(
  board: (Piece | null)[][],
  from: Square,
  to: Square,
  piece: Piece
): boolean {
  const rowDiff = to.row - from.row;
  const colDiff = to.col - from.col;
  const absRowDiff = Math.abs(rowDiff);
  const absColDiff = Math.abs(colDiff);
  
  // Pancake can move like a normal piece
  if (isValidNormalMove(board, from, to, piece)) {
    return true;
  }
  
  // Pancake can also move horizontally (1 square)
  if ((absRowDiff === 0 && absColDiff === 1) && board[to.row][to.col] === null) {
    return true;
  }
  
  // Pancake can capture horizontally
  if (absRowDiff === 0 && absColDiff === 2) {
    const midCol = from.col + colDiff / 2;
    const midPiece = board[from.row][midCol];
    
    return midPiece !== null && midPiece.player !== piece.player;
  }
  
  return false;
}

export function handleCapture(
  board: (Piece | null)[][],
  from: Square,
  to: Square,
  piece: Piece
): CaptureResult {
  const rowDiff = to.row - from.row;
  const colDiff = to.col - from.col;
  const absRowDiff = Math.abs(rowDiff);
  const absColDiff = Math.abs(colDiff);
  
  // Check if this is a capture move (distance of 2)
  if ((absRowDiff === 2 && absColDiff === 2) || 
      (piece.type === "pancake" && absRowDiff === 0 && absColDiff === 2)) {
    
    // Calculate the position of the captured piece
    const midRow = from.row + Math.sign(rowDiff) * (absRowDiff > 0 ? 1 : 0);
    const midCol = from.col + Math.sign(colDiff) * 1;
    
    // Get the captured piece
    const capturedPiece = board[midRow][midCol];
    
    // Ensure there is a piece to capture and it's an opponent's piece
    if (capturedPiece && capturedPiece.player !== piece.player) {
      return {
        capturedPiece,
        capturedSquare: { row: midRow, col: midCol }
      };
    }
  }
  
  // No capture was made
  return {
    capturedPiece: null,
    capturedSquare: null
  };
}

export function checkWinCondition(
  board: (Piece | null)[][],
  pieceCounts: Record<PlayerColor, number>
): WinResult {
  // Win if opponent has no pieces left
  if (pieceCounts.red === 0) {
    return { gameOver: true, winner: "blue" };
  }
  
  if (pieceCounts.blue === 0) {
    return { gameOver: true, winner: "red" };
  }
  
  // Check if any player has no valid moves left
  let redHasMoves = false;
  let blueHasMoves = false;
  
  // Scan board for pieces and check if they have valid moves
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      
      let moves: Square[] = [];
      switch (piece.type) {
        case "normal":
          moves = getNormalMoves(board, piece);
          break;
        case "bagel":
          moves = getBagelMoves(board, piece, []);  // Simplified, should pass real move history
          break;
        case "pancake":
          moves = getPancakeMoves(board, piece);
          break;
      }
      
      if (piece.player === "red" && moves.length > 0) {
        redHasMoves = true;
      } else if (piece.player === "blue" && moves.length > 0) {
        blueHasMoves = true;
      }
      
      // Early exit if both players have moves
      if (redHasMoves && blueHasMoves) {
        return { gameOver: false, winner: null };
      }
    }
  }
  
  // If a player has no moves, they lose
  if (!redHasMoves) {
    return { gameOver: true, winner: "blue" };
  }
  
  if (!blueHasMoves) {
    return { gameOver: true, winner: "red" };
  }
  
  // Game is still ongoing
  return { gameOver: false, winner: null };
}

function isValidDiagonalMove(
  from: Square,
  to: Square,
  crowned: boolean,
  player: PlayerColor
): boolean {
  const rowDiff = to.row - from.row;
  const colDiff = to.col - from.col;
  const absRowDiff = Math.abs(rowDiff);
  const absColDiff = Math.abs(colDiff);
  
  // Must be a diagonal move (same absolute difference in row and col)
  if (absRowDiff !== absColDiff) {
    return false;
  }
  
  // For non-crowned pieces, can only move forward
  if (!crowned) {
    if (player === "red" && rowDiff < 0) {
      return false;
    }
    if (player === "blue" && rowDiff > 0) {
      return false;
    }
  }
  
  return true;
}
