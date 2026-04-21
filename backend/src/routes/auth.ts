import { Router } from "express";
import bcrypt from "bcryptjs";
import { authenticateToken, generateToken } from "../middleware/auth.js";
import * as storage from "../services/storage.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, name, phone, role, companyName } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ message: "Email, password, and name are required" });
      return;
    }

    const existing = await storage.getUserByEmail(email);
    if (existing) {
      res.status(409).json({ message: "Email already in use" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      name,
      phone: phone || null,
      role: role || "tenant",
      verified: false,
      active: true
    });

    if (user.role === "contractor") {
      await storage.createContractor({
        userId: user.id,
        companyName: companyName || name,
        verified: false,
        totalReviews: 0
      });
    }

    const token = generateToken(user.id, user.role);
    const { password: _pw, ...safeUser } = user;
    res.status(201).json({ user: safeUser, token });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      await storage.createFailedLogin({ email, reason: "User not found", ipAddress: req.ip, userAgent: req.headers["user-agent"] });
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    if (!user.active) {
      res.status(403).json({ message: "Account is deactivated" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await storage.createFailedLogin({ email, reason: "Wrong password", ipAddress: req.ip, userAgent: req.headers["user-agent"] });
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = generateToken(user.id, user.role);
    const { password: _pw, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (error) {
    next(error);
  }
});

router.get("/me", authenticateToken, async (req, res, next) => {
  try {
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const { password: _pw, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    next(error);
  }
});

router.patch("/me", authenticateToken, async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) {
      const existing = await storage.getUserByEmail(email);
      if (existing && existing.id !== req.user!.id) {
        res.status(409).json({ message: "Email already in use" });
        return;
      }
      updates.email = email;
    }
    const user = await storage.updateUser(req.user!.id, updates);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const { password: _pw, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    next(error);
  }
});

router.post("/change-password", authenticateToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: "currentPassword and newPassword are required" });
      return;
    }
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      res.status(401).json({ message: "Current password is incorrect" });
      return;
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await storage.updateUser(req.user!.id, { password: hashed });
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;
