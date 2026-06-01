import { Router } from "express";
import multer from "multer";
import { PortfolioController } from "../controllers/PortfolioController";
import { requireAuth, requireRole } from "../lib/auth";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });
const router = Router();

// Public routes
router.get("/:profissionalId/albums", PortfolioController.getAlbums);
router.get("/albums/:albumId/images", PortfolioController.getAlbumImages);

// Protected routes (Professional only)
router.post("/albums", requireAuth, requireRole("PROFISSIONAL"), PortfolioController.createAlbum);
router.post("/albums/:albumId/upload", requireAuth, requireRole("PROFISSIONAL"), upload.array("files", 20), PortfolioController.uploadImages);

export default router;
