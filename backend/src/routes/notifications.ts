import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import * as storage from "../services/storage.js";

const router = Router();
router.use(authenticateToken);

router.get("/", async (req, res, next) => {
  try {
    const result = await storage.getNotifications(req.user!.id);
    res.json(result);
  } catch (error) { next(error); }
});

router.patch("/:id/read", async (req, res, next) => {
  try {
    await storage.markNotificationAsRead(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;
