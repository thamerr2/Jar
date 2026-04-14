import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import * as storage from "../services/storage.js";

const router = Router();
router.use(authenticateToken);

router.get("/", async (req, res, next) => {
  try {
    const propertyId = req.query.propertyId as string | undefined;
    const result = await storage.getUnits(propertyId);
    res.json(result);
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const unit = await storage.getUnit(req.params.id);
    if (!unit) { res.status(404).json({ message: "Unit not found" }); return; }
    res.json(unit);
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const { propertyId, unitNumber } = req.body;
    if (!propertyId || !unitNumber) {
      res.status(400).json({ message: "propertyId and unitNumber are required" });
      return;
    }
    const unit = await storage.createUnit(req.body);
    res.status(201).json(unit);
  } catch (error) { next(error); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const unit = await storage.updateUnit(req.params.id, req.body);
    if (!unit) { res.status(404).json({ message: "Unit not found" }); return; }
    res.json(unit);
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await storage.deleteUnit(req.params.id);
    res.status(204).send();
  } catch (error) { next(error); }
});

export default router;
