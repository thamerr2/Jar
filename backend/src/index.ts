import "dotenv/config";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import app from "./app.js";

const PORT = parseInt(process.env.PORT || "5001");
const HOST = "0.0.0.0";
const JWT_SECRET = process.env.JWT_SECRET || "jar-secret-key-change-in-production";

const server = http.createServer(app);

// ── WebSocket server ──────────────────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: "/ws" });

// userId → set of active sockets (a user can have multiple tabs open)
const socketMap = new Map<string, Set<WebSocket>>();

export function notifyUser(userId: string, payload: object): void {
  const sockets = socketMap.get(userId);
  if (!sockets) return;
  const data = JSON.stringify(payload);
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  }
}

export function broadcastNotification(payload: object): void {
  const data = JSON.stringify(payload);
  for (const sockets of socketMap.values()) {
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    }
  }
}

wss.on("connection", (ws) => {
  let userId: string | null = null;

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      // First message must be { type: "auth", token: "..." }
      if (msg.type === "auth" && msg.token && !userId) {
        const decoded = jwt.verify(msg.token, JWT_SECRET) as { userId: string };
        userId = decoded.userId;
        if (!socketMap.has(userId)) socketMap.set(userId, new Set());
        socketMap.get(userId)!.add(ws);
        ws.send(JSON.stringify({ type: "auth_ok", userId }));
        console.log(`[ws] user ${userId} connected`);
      }
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "Invalid message" }));
    }
  });

  ws.on("close", () => {
    if (userId) {
      const sockets = socketMap.get(userId);
      if (sockets) {
        sockets.delete(ws);
        if (sockets.size === 0) socketMap.delete(userId);
      }
      console.log(`[ws] user ${userId} disconnected`);
    }
  });

  ws.on("error", () => ws.terminate());
});

server.listen(PORT, HOST, () => {
  console.log(`[server] Jar API running on http://${HOST}:${PORT}`);
  console.log(`[server] Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`[server] Database: ${process.env.DATABASE_URL ? "configured" : "NOT configured"}`);
  console.log(`[server] Stripe: ${process.env.STRIPE_SECRET_KEY ? "configured" : "not configured"}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`[server] Port ${PORT} is already in use`);
    process.exit(1);
  }
  throw err;
});

process.on("SIGTERM", () => {
  server.close(() => {
    console.log("[server] Server closed");
    process.exit(0);
  });
});
