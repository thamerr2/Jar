import { Router, Request, Response, NextFunction } from "express";
import path from "path";
import { authenticateToken } from "../middleware/auth.js";
import { uploadSingle, uploadMultiple, deleteFile } from "../services/upload.js";
import * as storage from "../services/storage.js";

const router = Router();
router.use(authenticateToken);

router.post("/", (req: Request, res: Response, next: NextFunction) => {
  uploadSingle(req, res, async (err) => {
    if (err) { res.status(400).json({ message: err.message }); return; }
    if (!req.file) { res.status(400).json({ message: "No file uploaded" }); return; }

    try {
      const { parentType, parentId } = req.body;
      const url = `/uploads/${req.file.filename}`;
      const attachment = await storage.createAttachment({
        parentType: parentType || "general",
        parentId: parentId || "",
        filename: req.file.originalname,
        url,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedById: req.user!.id
      });
      res.status(201).json({ attachment, file: { url, filename: req.file.filename, mimeType: req.file.mimetype, size: req.file.size } });
    } catch (error) { next(error); }
  });
});

router.post("/multiple", (req: Request, res: Response, next: NextFunction) => {
  uploadMultiple(req, res, async (err) => {
    if (err) { res.status(400).json({ message: err.message }); return; }
    const files = req.files as Express.Multer.File[];
    if (!files?.length) { res.status(400).json({ message: "No files uploaded" }); return; }

    try {
      const { parentType, parentId } = req.body;
      const results = await Promise.all(files.map(async (file) => {
        const url = `/uploads/${file.filename}`;
        const attachment = await storage.createAttachment({
          parentType: parentType || "general",
          parentId: parentId || "",
          filename: file.originalname,
          url,
          mimeType: file.mimetype,
          size: file.size,
          uploadedById: req.user!.id
        });
        return { attachment, file: { url, filename: file.filename, mimeType: file.mimetype, size: file.size } };
      }));
      res.status(201).json(results);
    } catch (error) { next(error); }
  });
});

router.delete("/:attachmentId", async (req, res, next) => {
  try {
    // Note: would look up attachment record to get file path and delete from disk too
    await storage.deleteAttachment(req.params.attachmentId);
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;
