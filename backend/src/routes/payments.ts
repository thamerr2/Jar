import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import * as storage from "../services/storage.js";

const router = Router();
router.use(authenticateToken);

router.get("/", async (req, res, next) => {
  try {
    const role = req.user!.role;
    const userId = req.user!.id;
    const filters: Parameters<typeof storage.getPayments>[0] = {};

    if (role === "tenant") filters.payerId = userId;
    else if (role === "contractor") filters.payeeId = userId;

    if (req.query.maintenanceRequestId) filters.maintenanceRequestId = req.query.maintenanceRequestId as string;

    const result = await storage.getPayments(filters);
    res.json(result);
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const payment = await storage.createPayment({ ...req.body, payerId: req.user!.id });
    res.status(201).json(payment);
  } catch (error) { next(error); }
});

export default router;
