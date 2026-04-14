import { Router } from "express";
import { db } from "../db/index.js";
import * as storage from "../services/storage.js";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/messages", async (_req, res, next) => {
  try {
    const msgs = await storage.getSystemMessages(true);
    res.json(msgs);
  } catch (error) { next(error); }
});

router.get("/health", async (_req, res) => {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    const dbTime = Date.now() - start;
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      dbResponseTime: `${dbTime}ms`,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      services: {
        database: "connected",
        stripe: process.env.STRIPE_SECRET_KEY ? "configured" : "not configured"
      }
    });
  } catch {
    res.status(503).json({ status: "unhealthy", timestamp: new Date().toISOString() });
  }
});

router.get("/health/ready", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
});

router.get("/health/live", (_req, res) => {
  res.json({ alive: true });
});

export default router;
