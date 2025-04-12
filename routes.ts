import express, { Request, Response } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { insertGameSchema, insertMoveSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time game updates with proper error handling
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws', // Set a specific path for WebSocket connections to avoid conflicts with Vite HMR
    verifyClient: () => true, // Accept all connections for now
  });
  
  // Track connected clients and their status
  const clients = new Set<WebSocket>();
  
  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    clients.add(ws);
    
    // Send a welcome message to confirm connection
    ws.send(JSON.stringify({
      type: "connection_established",
      message: "Connected to game server"
    }));
    
    ws.on("message", (message) => {
      // Handle incoming WebSocket messages
      try {
        const data = JSON.parse(message.toString());
        console.log("Received message:", data.type);
        
        // Broadcast game updates to all connected clients
        if (data.type === "game_update") {
          clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(data));
            }
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });
    
    ws.on("close", () => {
      console.log("WebSocket client disconnected");
      clients.delete(ws);
    });
    
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  // Enable CORS for all routes
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  // API routes
  const apiRouter = express.Router();
  // Add a healthcheck endpoint
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });
  
  app.use("/api", apiRouter);

  // Games API
  apiRouter.post("/games", async (req: Request, res: Response) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(gameData);
      res.status(201).json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create game" });
      }
    }
  });

  apiRouter.get("/games/:id", async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ error: "Failed to get game" });
    }
  });

  apiRouter.patch("/games/:id", async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      // Update game state
      const updatedGame = await storage.updateGame(gameId, req.body);
      
      // Broadcast game update via WebSocket
      wss.clients.forEach((client) => {
        client.send(JSON.stringify({
          type: "game_update",
          gameId,
          data: updatedGame
        }));
      });
      
      res.json(updatedGame);
    } catch (error) {
      res.status(500).json({ error: "Failed to update game" });
    }
  });

  // Moves API
  apiRouter.post("/games/:gameId/moves", async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      const moveData = insertMoveSchema.parse({
        ...req.body,
        gameId
      });
      
      const move = await storage.createMove(moveData);
      
      // Broadcast move via WebSocket
      wss.clients.forEach((client) => {
        client.send(JSON.stringify({
          type: "move_made",
          gameId,
          data: move
        }));
      });
      
      res.status(201).json(move);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create move" });
      }
    }
  });

  apiRouter.get("/games/:gameId/moves", async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      const moves = await storage.getMovesByGameId(gameId);
      res.json(moves);
    } catch (error) {
      res.status(500).json({ error: "Failed to get moves" });
    }
  });

  return httpServer;
}
