import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Player schema
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertPlayerSchema = createInsertSchema(players).pick({
  username: true,
  password: true,
});

// Game schema
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  redPlayerId: integer("red_player_id").notNull(),
  bluePlayerId: integer("blue_player_id").notNull(),
  currentTurn: text("current_turn").notNull(), // "red" or "blue"
  status: text("status").notNull(), // "draft", "active", "completed"
  boardState: jsonb("board_state").notNull(), // JSON representation of the board
  winnerPlayerId: integer("winner_player_id"),
  createdAt: text("created_at").notNull(),
});

export const insertGameSchema = createInsertSchema(games).pick({
  redPlayerId: true,
  bluePlayerId: true,
  currentTurn: true,
  status: true,
  boardState: true,
});

// Game move schema
export const moves = pgTable("moves", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  playerId: integer("player_id").notNull(),
  moveNumber: integer("move_number").notNull(),
  fromRow: integer("from_row").notNull(),
  fromCol: integer("from_col").notNull(),
  toRow: integer("to_row").notNull(),
  toCol: integer("to_col").notNull(),
  captured: boolean("captured").notNull(),
  pieceType: text("piece_type").notNull(), // "normal", "bagel", "pancake"
  createdAt: text("created_at").notNull(),
});

export const insertMoveSchema = createInsertSchema(moves).pick({
  gameId: true,
  playerId: true,
  moveNumber: true,
  fromRow: true,
  fromCol: true,
  toRow: true,
  toCol: true,
  captured: true,
  pieceType: true,
});

// Export types
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

export type InsertMove = z.infer<typeof insertMoveSchema>;
export type Move = typeof moves.$inferSelect;

// Export piece types
export enum PieceType {
  NORMAL = "normal",
  BAGEL = "bagel",
  PANCAKE = "pancake",
}

// Export player colors
export enum PlayerColor {
  RED = "red",
  BLUE = "blue",
}

// Export game status
export enum GameStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  COMPLETED = "completed",
}
