import { Router } from "express";
import { FlashController } from "../controllers/flash.controller";
import { requireAuth } from "../lib/auth";

const router = Router();

// Públicos
router.post("/unlock", FlashController.unlock);

// Protegidos (Profissional/Admin)
router.post("/generate", requireAuth, FlashController.generateCards);
router.post("/link", requireAuth, FlashController.linkMedia);

export default router;
