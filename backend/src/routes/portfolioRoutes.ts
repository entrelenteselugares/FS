import { Router } from "express";
import multer from "multer";
import { PortfolioController } from "../controllers/PortfolioController";
import { requireAuth, requireRole } from "../lib/auth";

import os from "os";
const upload = multer({ dest: os.tmpdir() });
const router = Router();

// Public routes
router.get("/:profissionalId/albums", PortfolioController.getAlbums);
router.get("/albums/:albumId/images", PortfolioController.getAlbumImages);

// Protected routes (Professional only)
router.post("/albums", requireAuth, requireRole("PROFISSIONAL"), PortfolioController.createAlbum);
router.post("/albums/:albumId/upload", requireAuth, requireRole("PROFISSIONAL"), upload.array("files", 20), PortfolioController.uploadImages);

export default router;
