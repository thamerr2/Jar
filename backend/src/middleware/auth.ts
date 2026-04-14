import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "jar-secret-key-change-in-production";

export function generateToken(userId: string, role: string): string {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: "7d" });
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }
    next();
  };
}
