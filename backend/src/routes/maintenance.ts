import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import * as storage from "../services/storage.js";
// notifyUser is imported lazily to avoid circular-dep at startup
let _notifyUser: ((userId: string, payload: object) => void) | null = null;
async function getNotify() {
  if (!_notifyUser) {
    const mod = await import("../index.js");
    _notifyUser = mod.notifyUser;
  }
  return _notifyUser;
}
function pushToUser(userId: string, payload: object) {
  getNotify().then(fn => fn?.(userId, payload)).catch(() => {});
}

const router = Router();
router.use(authenticateToken);

router.get("/stats", async (req, res, next) => {
  try {
    const role = req.user!.role;
    const userId = req.user!.id;

    let filters: Parameters<typeof storage.getMaintenanceStats>[0] = {};

    if (role === "tenant") {
      filters.createdById = userId;
    } else if (role === "contractor") {
      const contractor = await storage.getContractorByUserId(userId);
      if (contractor) filters.assignedToContractorId = contractor.id;
    } else if (role === "owner") {
      const props = await storage.getProperties(userId);
      if (props.length > 0) {
        const allUnits = await Promise.all(props.map(p => storage.getUnits(p.id)));
        filters.unitIds = allUnits.flat().map(u => u.id);
      }
    }

    const stats = await storage.getMaintenanceStats(filters);
    res.json(stats);
  } catch (error) { next(error); }
});

router.get("/", async (req, res, next) => {
  try {
    const role = req.user!.role;
    const userId = req.user!.id;

    let filters: Parameters<typeof storage.getMaintenanceRequests>[0] = {};

    if (req.query.status) filters.status = req.query.status as string;

    if (role === "tenant") {
      filters.createdById = userId;
    } else if (role === "contractor") {
      const contractor = await storage.getContractorByUserId(userId);
      if (contractor) filters.assignedToContractorId = contractor.id;
    } else if (role === "owner") {
      const props = await storage.getProperties(userId);
      if (props.length > 0) {
        const allUnits = await Promise.all(props.map(p => storage.getUnits(p.id)));
        filters.unitIds = allUnits.flat().map(u => u.id);
      } else {
        res.json([]);
        return;
      }
    }

    const result = await storage.getMaintenanceRequests(filters);
    res.json(result);
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const req_ = await storage.getMaintenanceRequest(req.params.id);
    if (!req_) { res.status(404).json({ message: "Maintenance request not found" }); return; }
    res.json(req_);
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const { unitId, title, description, category } = req.body;
    if (!unitId || !title || !description || !category) {
      res.status(400).json({ message: "unitId, title, description, and category are required" });
      return;
    }
    const data = {
      ...req.body,
      createdById: req.user!.id,
      scheduledDate: req.body.scheduledDate ? new Date(req.body.scheduledDate) : null
    };
    const created = await storage.createMaintenanceRequest(data);

    // Notify property owner
    try {
      const unit = await storage.getUnit(created.unitId);
      if (unit) {
        const props = await storage.getProperties();
        const prop = props.find(p => p.id === unit.propertyId);
        if (prop) {
          await storage.createNotification({
            userId: prop.ownerId,
            type: "maintenance_created",
            title: "New Maintenance Request",
            message: `A new maintenance request has been submitted: ${created.title}`,
            link: `/maintenance/${created.id}`,
            read: false
          });
        }
      }
    } catch { /* notification failure is non-critical */ }

    res.status(201).json(created);
  } catch (error) { next(error); }
});

// ── Matching providers (Marketplace mode) ─────────────────────────────────────
router.get("/:id/matching-providers", async (req, res, next) => {
  try {
    const mr = await storage.getMaintenanceRequest(req.params.id);
    if (!mr) { res.status(404).json({ message: "Request not found" }); return; }
    const matches = await storage.getMatchingContractors(mr.category);
    res.json(matches.map(c => ({
      id:          c.id,
      userId:      c.userId,
      companyName: c.companyName,
      description: c.description,
      specialties: c.specialties,
      rating:      c.rating,
      totalReviews: c.totalReviews,
      verified:    c.verified,
      userName:    c.user.name,
      userAvatar:  c.user.avatar,
    })));
  } catch (error) { next(error); }
});

// ── Broadcast to all matching providers (Bidding mode) ───────────────────────
router.post("/:id/broadcast", async (req, res, next) => {
  try {
    const mr = await storage.getMaintenanceRequest(req.params.id);
    if (!mr) { res.status(404).json({ message: "Request not found" }); return; }

    const updated = await storage.updateMaintenanceRequest(req.params.id, {
      broadcastedAt: new Date()
    } as any);

    const matches = await storage.getMatchingContractors(mr.category);
    await Promise.allSettled(matches.map(c =>
      storage.createNotification({
        userId: c.userId,
        type: "maintenance_created",
        title: "New Job Request",
        message: `New ${mr.category} job: ${mr.title} — submit your quote now`,
        link: `/jobs`,
        read: false
      })
    ));

    res.json({ broadcasted: matches.length, request: updated });
  } catch (error) { next(error); }
});

// ── Beneficiary confirms completion → under_review / release escrow ──────────
router.post("/:id/confirm-complete", async (req, res, next) => {
  try {
    const mr = await storage.getMaintenanceRequest(req.params.id);
    if (!mr) { res.status(404).json({ message: "Request not found" }); return; }
    if (mr.status !== "completed") {
      res.status(400).json({ message: "Request is not in completed state" }); return;
    }

    const updated = await storage.updateMaintenanceRequest(req.params.id, {
      status: "under_review",
    });

    // Notify provider that beneficiary confirmed
    if (mr.assignedToId) {
      const contractor = await storage.getContractor(mr.assignedToId);
      if (contractor) {
        await storage.createNotification({
          userId: contractor.userId,
          type: "maintenance_completed",
          title: "Job Confirmed by Client",
          message: `The client confirmed completion of "${mr.title}". Payment will be released shortly.`,
          link: `/jobs`,
          read: false
        });
      }
    }

    res.json(updated);
  } catch (error) { next(error); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await storage.getMaintenanceRequest(req.params.id);
    if (!existing) { res.status(404).json({ message: "Maintenance request not found" }); return; }

    const data = { ...req.body };
    if (data.scheduledDate) data.scheduledDate = new Date(data.scheduledDate);
    if (data.status === "completed" && !data.completedAt) data.completedAt = new Date();
    if (data.status === "closed" && !data.closedAt) data.closedAt = new Date();

    const updated = await storage.updateMaintenanceRequest(req.params.id, data);

    // Notify on status change
    if (data.status && data.status !== existing.status) {
      try {
        await storage.createNotification({
          userId: existing.createdById,
          type: "maintenance_updated",
          title: "Maintenance Request Updated",
          message: `Your request "${existing.title}" status changed to ${data.status}`,
          link: `/maintenance/${existing.id}`,
          read: false
        });
        // Real-time push
        pushToUser(existing.createdById, {
          type: "maintenance_status_changed",
          requestId: existing.id,
          status: data.status,
          title: existing.title
        });
      } catch { /* non-critical */ }
    }

    res.json(updated);
  } catch (error) { next(error); }
});

export default router;
