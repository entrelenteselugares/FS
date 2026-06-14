import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../lib/auth";
import { SubscriptionService } from "../services/subscription.service";
import { prisma } from "../lib/prisma";

const router = Router();

// POST /api/sanfona/subscribe
router.post("/subscribe", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Não autorizado" });

    const result = await SubscriptionService.createSanfonaSubscription(userId);
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
      orderBy: { createdAt: 'desc' }
    });

    return res.json(batches);
  } catch (error: any) {
    console.error("[SANFONA BATCHES ERROR]:", error.message);
    return res.status(500).json({ error: "Erro ao buscar lotes" });
  }
});

export default router;
