// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  players;
  games;
  moves;
  playerIdCounter;
  gameIdCounter;
  moveIdCounter;
  constructor() {
    this.players = /* @__PURE__ */ new Map();
    this.games = /* @__PURE__ */ new Map();
    this.moves = /* @__PURE__ */ new Map();
    this.playerIdCounter = 1;
    this.gameIdCounter = 1;
    this.moveIdCounter = 1;
  }
  // Player operations
  async getPlayer(id) {
    return this.players.get(id);
  }
  async getPlayerByUsername(username) {
    return Array.from(this.players.values()).find(
      (player) => player.username === username
    );
  }
  async createPlayer(player) {
    const id = this.playerIdCounter++;
    const newPlayer = { ...player, id };
    this.players.set(id, newPlayer);
    return newPlayer;
  }
  // Game operations
  async getGame(id) {
    return this.games.get(id);
  }
  async createGame(game) {
    const id = this.gameIdCounter++;
    const newGame = {
      ...game,
      id,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      winnerPlayerId: null
    };
    this.games.set(id, newGame);
    return newGame;
  }
  async updateGame(id, data) {
    const game = this.games.get(id);
    if (!game) {
      throw new Error(`Game with id ${id} not found`);
    }
    const updatedGame = { ...game, ...data };
    this.games.set(id, updatedGame);
    return updatedGame;
  }
  async getGamesByPlayerId(playerId) {
    return Array.from(this.games.values()).filter(
      (game) => game.redPlayerId === playerId || game.bluePlayerId === playerId
    );
  }
  // Move operations
  async createMove(move) {
    const id = this.moveIdCounter++;
    const newMove = {
      ...move,
      id,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.moves.set(id, newMove);
    return newMove;
  }
  async getMovesByGameId(gameId) {
    return Array.from(this.moves.values()).filter((move) => move.gameId === gameId).sort((a, b) => a.moveNumber - b.moveNumber);
  }
};
var storage = new MemStorage();

// server/routes.ts
import { WebSocketServer, WebSocket } from "ws";

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var players = pgTable("players", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var insertPlayerSchema = createInsertSchema(players).pick({
  username: true,
  password: true
});
var games = pgTable("games", {
  id: serial("id").primaryKey(),
  redPlayerId: integer("red_player_id").notNull(),
  bluePlayerId: integer("blue_player_id").notNull(),
  currentTurn: text("current_turn").notNull(),
  // "red" or "blue"
  status: text("status").notNull(),
  // "draft", "active", "completed"
  boardState: jsonb("board_state").notNull(),
  // JSON representation of the board
  winnerPlayerId: integer("winner_player_id"),
  createdAt: text("created_at").notNull()
});
var insertGameSchema = createInsertSchema(games).pick({
  redPlayerId: true,
  bluePlayerId: true,
  currentTurn: true,
  status: true,
  boardState: true
});
var moves = pgTable("moves", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  playerId: integer("player_id").notNull(),
  moveNumber: integer("move_number").notNull(),
  fromRow: integer("from_row").notNull(),
  fromCol: integer("from_col").notNull(),
  toRow: integer("to_row").notNull(),
  toCol: integer("to_col").notNull(),
  captured: boolean("captured").notNull(),
  pieceType: text("piece_type").notNull(),
  // "normal", "bagel", "pancake"
  createdAt: text("created_at").notNull()
});
var insertMoveSchema = createInsertSchema(moves).pick({
  gameId: true,
  playerId: true,
  moveNumber: true,
  fromRow: true,
  fromCol: true,
  toRow: true,
  toCol: true,
  captured: true,
  pieceType: true
});

// server/routes.ts
import { z } from "zod";
async function registerRoutes(app2) {
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({
    server: httpServer,
    verifyClient: () => true
    // Accept all connections for now
  });
  const clients = /* @__PURE__ */ new Set();
  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    clients.add(ws);
    ws.send(JSON.stringify({
      type: "connection_established",
      message: "Connected to game server"
    }));
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log("Received message:", data.type);
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
  app2.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });
  const apiRouter = express.Router();
  app2.get("/health", (req, res) => {
    res.status(200).send("OK");
  });
  app2.use("/api", apiRouter);
  apiRouter.post("/games", async (req, res) => {
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
  apiRouter.get("/games/:id", async (req, res) => {
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
  apiRouter.patch("/games/:id", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      const updatedGame = await storage.updateGame(gameId, req.body);
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
  apiRouter.post("/games/:gameId/moves", async (req, res) => {
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
  apiRouter.get("/games/:gameId/moves", async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      const moves2 = await storage.getMovesByGameId(gameId);
      res.json(moves2);
    } catch (error) {
      res.status(500).json({ error: "Failed to get moves" });
    }
  });
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import cors from "cors";
var app = express3();
app.use(cors({
  origin: true,
  // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
