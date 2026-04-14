import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import * as storage from "../services/storage.js";

const router = Router();
router.use(authenticateToken);

// POST /api/ratings — beneficiary submits a rating for a contractor
router.post("/", async (req, res, next) => {
  try {
    const { maintenanceRequestId, toContractorId, score, comment, flaggedAccessibility, flagNote } = req.body;

    if (!maintenanceRequestId || !toContractorId || !score) {
      res.status(400).json({ message: "maintenanceRequestId, toContractorId and score are required" });
      return;
    }
    if (score < 1 || score > 5) {
      res.status(400).json({ message: "Score must be between 1 and 5" });
      return;
    }

    // Only allow rating once per request
    const existing = await storage.getRatingByRequest(maintenanceRequestId, req.user!.id);
    if (existing) {
      res.status(409).json({ message: "You have already rated this request" });
      return;
    }

    const mr = await storage.getMaintenanceRequest(maintenanceRequestId);
    if (!mr) { res.status(404).json({ message: "Maintenance request not found" }); return; }
    if (!["under_review", "closed"].includes(mr.status)) {
      res.status(400).json({ message: "Can only rate after job is completed and confirmed" });
      return;
    }

    const rating = await storage.createRating({
      maintenanceRequestId,
      fromUserId: req.user!.id,
      toContractorId,
      score,
      comment: comment ?? null,
      flaggedAccessibility: flaggedAccessibility ?? false,
      flagNote: flagNote ?? null
    });

    // Recalculate contractor's aggregate rating
    await storage.recalculateContractorRating(toContractorId);

    // Close the request now that it's been rated
    await storage.updateMaintenanceRequest(maintenanceRequestId, {
      status: "closed",
      closedAt: new Date()
    });

    res.status(201).json(rating);
  } catch (error) { next(error); }
});

// GET /api/ratings/contractor/:id — get all ratings for a contractor
router.get("/contractor/:id", async (req, res, next) => {
  try {
    const ratingsList = await storage.getRatingsByContractor(req.params.id);
    res.json(ratingsList.map(r => ({
      id:                   r.id,
      maintenanceRequestId: r.maintenanceRequestId,
      score:                r.score,
      comment:              r.comment,
      flaggedAccessibility: r.flaggedAccessibility,
      createdAt:            r.createdAt,
      fromUser: {
        name:   r.fromUser.name,
        avatar: r.fromUser.avatar
      }
    })));
  } catch (error) { next(error); }
});

// GET /api/ratings/request/:id — check if current user has rated a request
router.get("/request/:id", async (req, res, next) => {
  try {
    const existing = await storage.getRatingByRequest(req.params.id, req.user!.id);
    res.json({ rated: !!existing, rating: existing ?? null });
  } catch (error) { next(error); }
});

export default router;
