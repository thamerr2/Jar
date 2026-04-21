import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import * as storage from "../services/storage.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const specialty = req.query.specialty as string | undefined;
    const result = await storage.getContractors(specialty);
    res.json(result);
  } catch (error) { next(error); }
});

router.get("/me", authenticateToken, async (req, res, next) => {
  try {
    const contractor = await storage.getContractorByUserId(req.user!.id);
    if (!contractor) { res.status(404).json({ message: "Contractor profile not found" }); return; }
    res.json(contractor);
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const contractor = await storage.getContractor(req.params.id);
    if (!contractor) { res.status(404).json({ message: "Contractor not found" }); return; }
    res.json(contractor);
  } catch (error) { next(error); }
});

router.patch("/:id", authenticateToken, async (req, res, next) => {
  try {
    const contractor = await storage.updateContractor(req.params.id, req.body);
    if (!contractor) { res.status(404).json({ message: "Contractor not found" }); return; }
    res.json(contractor);
  } catch (error) { next(error); }
});

export default router;
