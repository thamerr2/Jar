import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import * as storage from "../services/storage.js";

const router = Router();
router.use(authenticateToken);

router.get("/", async (req, res, next) => {
  try {
    const tenantId = req.user!.role === "tenant" ? req.user!.id : (req.query.tenantId as string | undefined);
    const unitId = req.query.unitId as string | undefined;
    const result = await storage.getLeases(tenantId, unitId);
    res.json(result);
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const lease = await storage.getLease(req.params.id);
    if (!lease) { res.status(404).json({ message: "Lease not found" }); return; }
    res.json(lease);
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const lease = await storage.createLease({
      ...req.body,
      startDate: new Date(req.body.startDate),
      endDate: req.body.endDate ? new Date(req.body.endDate) : null
    });
    await storage.updateUnit(lease.unitId, { isOccupied: true });
    res.status(201).json(lease);
  } catch (error) { next(error); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    const lease = await storage.updateLease(req.params.id, data);
    if (!lease) { res.status(404).json({ message: "Lease not found" }); return; }
    res.json(lease);
  } catch (error) { next(error); }
});

export default router;
