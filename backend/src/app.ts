import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? (process.env.FRONTEND_URL || true)
    : ["http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));

// Body parsers (must come before routes, but after Stripe webhook raw body route)
app.use((req, res, next) => {
  if (req.path === "/api/stripe/webhook") return next();
  express.json()(req, res, next);
});
app.use(express.urlencoded({ extended: true }));

// Rate limiting on API routes
app.use("/api", rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith("/api/stripe/webhook")
}));

// Static uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// API routes
registerRoutes(app);

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  const frontendDist = path.join(__dirname, "../../frontend/dist");
  app.use(express.static(frontendDist));
  // SPA fallback — send index.html for any non-API route
  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  // 404 handler for API-only dev mode
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: "Not found" });
  });
}

// Global error handler
app.use((err: Error & { status?: number; statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  const status = (err as any).status || (err as any).statusCode || 500;
  const message = err.message || "Internal server error";
  if (process.env.NODE_ENV !== "production") console.error(err);
  res.status(status).json({ message });
});

export default app;
