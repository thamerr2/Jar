import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import * as storage from "../services/storage.js";

const router = Router();
router.use(authenticateToken);

router.get("/:maintenanceRequestId", async (req, res, next) => {
  try {
    const result = await storage.getComments(req.params.maintenanceRequestId);
    res.json(result);
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const comment = await storage.createComment({ ...req.body, userId: req.user!.id });
    res.status(201).json(comment);
  } catch (error) { next(error); }
});

export default router;
