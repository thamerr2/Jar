import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import * as storage from "../services/storage.js";

const router = Router();

router.use(authenticateToken);

router.get("/", async (req, res, next) => {
  try {
    const ownerId = req.user!.role === "owner" ? req.user!.id : undefined;
    const props = await storage.getProperties(ownerId);
    res.json(props);
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const prop = await storage.getProperty(req.params.id);
    if (!prop) { res.status(404).json({ message: "Property not found" }); return; }
    res.json(prop);
  } catch (error) { next(error); }
});

router.post("/", requireRole("owner", "super_admin", "union_admin"), async (req, res, next) => {
  try {
    const { title, address, city } = req.body;
    if (!title || !address || !city) {
      res.status(400).json({ message: "title, address, and city are required" });
      return;
    }
    const prop = await storage.createProperty({ ...req.body, ownerId: req.user!.id });
    res.status(201).json(prop);
  } catch (error) { next(error); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const prop = await storage.updateProperty(req.params.id, req.body);
    if (!prop) { res.status(404).json({ message: "Property not found" }); return; }
    res.json(prop);
  } catch (error) { next(error); }
});

router.delete("/:id", requireRole("owner", "super_admin", "union_admin"), async (req, res, next) => {
  try {
    await storage.deleteProperty(req.params.id);
    res.status(204).send();
  } catch (error) { next(error); }
});

export default router;
