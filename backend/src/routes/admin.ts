import { Router } from "express";
import bcrypt from "bcryptjs";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import * as storage from "../services/storage.js";

const router = Router();
router.use(authenticateToken, requireRole("super_admin"));

router.get("/stats", async (_req, res, next) => {
  try {
    const stats = await storage.getAdminStats();
    res.json(stats);
  } catch (error) { next(error); }
});

router.get("/users", async (req, res, next) => {
  try {
    const filters: Parameters<typeof storage.getAllUsers>[0] = {};
    if (req.query.role) filters.role = req.query.role as string;
    if (req.query.active !== undefined) filters.active = req.query.active === "true";
    if (req.query.search) filters.search = req.query.search as string;
    const users = await storage.getAllUsers(filters);
    res.json(users.map(({ password: _pw, ...u }) => u));
  } catch (error) { next(error); }
});

router.post("/users", async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) {
      res.status(400).json({ message: "Name, email, password, and role are required" });
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
      role,
      verified: false,
      active: true
    });
    if (role === "contractor") {
      await storage.createContractor({ userId: user.id, companyName: name, verified: false, totalReviews: 0 });
    }
    const admin = await storage.getUser(req.user!.id);
    await storage.createActivityLog({
      userId: req.user!.id,
      userEmail: admin?.email ?? null,
      userRole: req.user!.role,
      action: "user_created",
      entityType: "user",
      entityId: user.id,
      details: `Created user ${email} with role ${role}`
    });
    const { password: _pw, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (error) { next(error); }
});

router.patch("/users/:id/activate", async (req, res, next) => {
  try {
    await storage.activateUser(req.params.id);
    const admin = await storage.getUser(req.user!.id);
    await storage.createActivityLog({
      userId: req.user!.id,
      userEmail: admin?.email ?? null,
      userRole: req.user!.role,
      action: "user_activated",
      entityType: "user",
      entityId: req.params.id
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.patch("/users/:id/deactivate", async (req, res, next) => {
  try {
    await storage.deactivateUser(req.params.id);
    const admin = await storage.getUser(req.user!.id);
    await storage.createActivityLog({
      userId: req.user!.id,
      userEmail: admin?.email ?? null,
      userRole: req.user!.role,
      action: "user_deactivated",
      entityType: "user",
      entityId: req.params.id
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.patch("/users/:id/role", async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role) { res.status(400).json({ message: "Role is required" }); return; }
    await storage.updateUser(req.params.id, { role });
    const admin = await storage.getUser(req.user!.id);
    await storage.createActivityLog({
      userId: req.user!.id,
      userEmail: admin?.email ?? null,
      userRole: req.user!.role,
      action: "user_updated",
      entityType: "user",
      entityId: req.params.id,
      details: `Role changed to ${role}`
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.delete("/users/:id", async (req, res, next) => {
  try {
    if (req.params.id === req.user!.id) {
      res.status(400).json({ message: "Cannot delete your own account" });
      return;
    }
    await storage.deleteUser(req.params.id);
    const admin = await storage.getUser(req.user!.id);
    await storage.createActivityLog({
      userId: req.user!.id,
      userEmail: admin?.email ?? null,
      userRole: req.user!.role,
      action: "user_deleted",
      entityType: "user",
      entityId: req.params.id
    });
    res.status(204).send();
  } catch (error) { next(error); }
});

router.get("/activity-logs", async (req, res, next) => {
  try {
    const filters: Parameters<typeof storage.getActivityLogs>[0] = {};
    if (req.query.userId) filters.userId = req.query.userId as string;
    if (req.query.action) filters.action = req.query.action as string;
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
    const logs = await storage.getActivityLogs(filters);
    res.json(logs);
  } catch (error) { next(error); }
});

router.get("/settings", async (_req, res, next) => {
  try {
    const settings = await storage.getSystemSettings();
    res.json(settings);
  } catch (error) { next(error); }
});

router.put("/settings/:key", async (req, res, next) => {
  try {
    const setting = await storage.upsertSystemSetting({
      key: req.params.key,
      value: req.body.value,
      description: req.body.description,
      updatedById: req.user!.id
    });
    res.json(setting);
  } catch (error) { next(error); }
});

router.get("/failed-logins", async (_req, res, next) => {
  try {
    const result = await storage.getFailedLogins();
    res.json(result);
  } catch (error) { next(error); }
});

router.patch("/failed-logins/:id/resolve", async (req, res, next) => {
  try {
    await storage.resolveFailedLogin(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.post("/failed-logins/resolve-all", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ message: "Email is required" }); return; }
    await storage.resolveAllFailedLogins(email);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.get("/messages", async (_req, res, next) => {
  try {
    const msgs = await storage.getSystemMessages();
    res.json(msgs);
  } catch (error) { next(error); }
});

router.post("/messages", async (req, res, next) => {
  try {
    const msg = await storage.createSystemMessage({ ...req.body, createdById: req.user!.id });
    res.status(201).json(msg);
  } catch (error) { next(error); }
});

router.patch("/messages/:id", async (req, res, next) => {
  try {
    const msg = await storage.updateSystemMessage(req.params.id, req.body);
    if (!msg) { res.status(404).json({ message: "Message not found" }); return; }
    res.json(msg);
  } catch (error) { next(error); }
});

router.delete("/messages/:id", async (req, res, next) => {
  try {
    await storage.deleteSystemMessage(req.params.id);
    res.status(204).send();
  } catch (error) { next(error); }
});

// ── Dispatch Mode (Marketplace vs Bidding) ───────────────────────────────────
router.get("/settings/dispatch-mode", async (_req, res, next) => {
  try {
    const setting = await storage.getSystemSetting("dispatch_mode");
    res.json({ mode: setting?.value ?? "marketplace" });
  } catch (error) { next(error); }
});

router.patch("/settings/dispatch-mode", async (req, res, next) => {
  try {
    const { mode } = req.body;
    if (!["marketplace", "bidding"].includes(mode)) {
      res.status(400).json({ message: "mode must be 'marketplace' or 'bidding'" });
      return;
    }
    await storage.upsertSystemSetting({
      key: "dispatch_mode",
      value: mode,
      description: "Service request dispatch model: marketplace (curated list) or bidding (open quotes)",
      updatedById: req.user!.id
    });
    res.json({ mode });
  } catch (error) { next(error); }
});

export default router;
