import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import * as storage from "../services/storage.js";

const router = Router();
router.use(authenticateToken);

router.get("/stats", async (req, res, next) => {
  try {
    const stats = await storage.getDashboardStats(req.user!.id);
    res.json(stats);
  } catch (error) { next(error); }
});

export default router;
