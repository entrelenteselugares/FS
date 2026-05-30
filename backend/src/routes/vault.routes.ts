import { Router } from "express";
import { requireAuth } from "../lib/auth";
import { VaultController } from "../controllers/vault.controller";
import multer from "multer";
import os from "os";

const upload = multer({ dest: os.tmpdir() });
const router = Router();

// ── VAULTS (Cofres de Memórias - Fase 11)
router.get("/media/proxy/:fileId", VaultController.proxyMedia);
router.get("/", requireAuth, VaultController.listAlbums);
router.post("/", requireAuth, VaultController.createAlbum);
router.patch("/:albumId", requireAuth, VaultController.renameAlbum);
router.get("/:albumId", requireAuth, VaultController.getAlbumDetails);
router.get("/:albumId/download-all", requireAuth, VaultController.downloadAllMedia);
router.get("/:albumId/media", requireAuth, VaultController.listMedia);
// Upload direto de mídias (Direct Upload via Google Drive Resumable)
router.post("/:albumId/upload/init", requireAuth, VaultController.initResumableUpload);
router.post("/:albumId/upload/complete", requireAuth, VaultController.completeResumableUpload);

// Legado: Upload via Vercel (Pode falhar para vídeos > 4.5MB)
router.post("/:albumId/upload", requireAuth, upload.single("file"), VaultController.uploadMedia);
router.post("/media/:mediaId/vote", requireAuth, (req: any, res: any, next: any) => VaultController.voteMedia(req, res, next));
router.post("/:albumId/checkout", requireAuth, VaultController.checkoutVault);
router.post("/:albumId/services/buy", requireAuth, VaultController.buyService);
router.post("/:albumId/subscribe", requireAuth, VaultController.subscribe);
router.post("/:albumId/invite", requireAuth, VaultController.generateInvite);
router.get("/invitation/:code", VaultController.getInvitationDetails);
router.get("/share/:code", VaultController.sharePreview);
router.post("/invitation/:code/accept", requireAuth, VaultController.acceptInvite);
router.delete("/:albumId/members/:userId", requireAuth, VaultController.removeMember);
router.delete("/:albumId/media/:mediaId", requireAuth, VaultController.deleteMedia);
router.patch("/:albumId/media/:mediaId/rotate", requireAuth, VaultController.rotateMedia);
router.patch("/:albumId/media/:mediaId/status", requireAuth, VaultController.updateMediaStatus);

export default router;
