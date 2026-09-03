import fs from "fs";
import path from "path";
import { Router } from "express";
import multer from "multer";
import { requireAdminAuth } from "../auth";

export const localStorageRouter = Router();

const storageDir = path.resolve(
  process.cwd(),
  "client",
  "public",
  "manus-storage"
);
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, storageDir);
  },
  filename: (req, _file, cb) => {
    const key = decodeURIComponent(
      req.params.key || `upload_${Date.now()}.jpg`
    );
    cb(null, key);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

localStorageRouter.post(
  "/upload/:key",
  requireAdminAuth,
  upload.single("file"),
  (req, res) => {
    const key = req.params.key;
    const publicUrl = `/manus-storage/${key}`;

    return res.json({
      success: true,
      storageKey: key,
      publicUrl,
    });
  }
);
