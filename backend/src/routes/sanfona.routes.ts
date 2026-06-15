import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../lib/auth";
import { SubscriptionService } from "../services/subscription.service";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabase";

const router = Router();

// POST /api/sanfona/subscribe
router.post("/subscribe", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Não autorizado" });

    const { cardTokenId } = req.body;

    const result = await SubscriptionService.createSanfonaSubscription(userId, cardTokenId);
    return res.json(result);
  } catch (error: any) {
    console.error("[SANFONA SUBSCRIBE ERROR]:", error.message);
    return res.status(400).json({ error: error.message || "Erro ao gerar assinatura" });
  }
});

// GET /api/sanfona/batches
router.get("/batches", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Não autorizado" });

    const batches = await prisma.albumSanfonaBatch.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    return res.json(batches);
  } catch (error: any) {
    console.error("[SANFONA BATCHES ERROR]:", error.message);
    return res.status(500).json({ error: "Erro ao buscar lotes" });
  }
});

// POST /api/sanfona/submit-batch
router.post("/submit-batch", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Não autorizado" });

    const { photos } = req.body;
    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ error: "Nenhuma foto enviada." });
    }

    if (photos.length > 10) {
      return res.status(400).json({ error: "Você só pode enviar até 10 fotos por mês." });
    }

    // Valida se o usuário é assinante ativo
    const subscription = await prisma.subscription.findFirst({
      where: { userId, type: "ALBUM_SANFONA", status: "ACTIVE" }
    });

    if (!subscription) {
      return res.status(403).json({ error: "Você precisa ter uma assinatura ativa do Clube do Álbum Sanfona." });
    }

    // Garante que o bucket existe no Supabase (não quebra se já existir)
    try {
      await supabaseAdmin.storage.createBucket("sanfona-uploads", {
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      });
    } catch (_e) {
      // bucket já existe — ignorar
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Atualiza ou cria o batch do mês corrente, marcando como SUBMITTED
    const batch = await prisma.albumSanfonaBatch.upsert({
      where: {
        userId_month: { userId, month: currentMonth }
      },
      update: { photos, status: "SUBMITTED" },
      create: { userId, month: currentMonth, photos, status: "SUBMITTED" }
    });

    return res.json({ success: true, batch });
  } catch (error: any) {
    console.error("[SANFONA SUBMIT ERROR]:", error.message);
    return res.status(500).json({ error: "Erro ao submeter lote." });
  }
});

export default router;
