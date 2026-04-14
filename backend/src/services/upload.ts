import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "10485760");

const ALLOWED_MIMETYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "text/csv"
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), UPLOAD_DIR);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

export const uploadSingle = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } }).single("file");
export const uploadMultiple = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } }).array("files", 5);

export async function deleteFile(filepath: string): Promise<void> {
  try {
    await fs.unlink(filepath);
  } catch {
    // File may not exist
  }
}
