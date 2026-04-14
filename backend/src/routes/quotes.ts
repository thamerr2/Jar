import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import * as storage from "../services/storage.js";

const router = Router();
router.use(authenticateToken);

router.get("/", async (req, res, next) => {
  try {
    const maintenanceRequestId = req.query.maintenanceRequestId as string | undefined;
    const contractorId = req.query.contractorId as string | undefined;
    const result = await storage.getQuotes(maintenanceRequestId, contractorId);
    res.json(result);
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const quote = await storage.getQuote(req.params.id);
    if (!quote) { res.status(404).json({ message: "Quote not found" }); return; }
    res.json(quote);
  } catch (error) { next(error); }
});

router.post("/", requireRole("contractor"), async (req, res, next) => {
  try {
    const contractor = await storage.getContractorByUserId(req.user!.id);
    if (!contractor) { res.status(404).json({ message: "Contractor profile not found" }); return; }

    const data = {
      ...req.body,
      contractorId: contractor.id,
      validUntil: req.body.validUntil ? new Date(req.body.validUntil) : null
    };
    const quote = await storage.createQuote(data);

    // Notify request creator
    try {
      const mReq = await storage.getMaintenanceRequest(quote.maintenanceRequestId);
      if (mReq) {
        await storage.createNotification({
          userId: mReq.createdById,
          type: "quote_received",
          title: "New Quote Received",
          message: `A contractor submitted a quote of ${quote.amount} SAR for your request`,
          link: `/maintenance/${mReq.id}`,
          read: false
        });
      }
    } catch { /* non-critical */ }

    res.status(201).json(quote);
  } catch (error) { next(error); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.validUntil) data.validUntil = new Date(data.validUntil);
    const quote = await storage.updateQuote(req.params.id, data);
    if (!quote) { res.status(404).json({ message: "Quote not found" }); return; }

    if (data.status === "accepted") {
      try {
        await storage.createNotification({
          userId: req.user!.id,
          type: "quote_accepted",
          title: "Quote Accepted",
          message: "Your quote has been accepted",
          link: `/maintenance/${quote.maintenanceRequestId}`,
          read: false
        });
      } catch { /* non-critical */ }
    }

    res.json(quote);
  } catch (error) { next(error); }
});

export default router;
