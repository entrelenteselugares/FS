import { Request, Response } from "express";
import { AffiliateService } from "../services/affiliate.service";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";

export class AffiliateController {
  /**
   * GET /api/affiliate/dashboard
   * Retorna os dados do painel do afiliado logado.
   */
  static async getDashboard(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "Não autorizado" });

      const data = await AffiliateService.getDashboardData(userId);
      return res.json(data);
    } catch (e: unknown) {
      console.error("[AffiliateController.getDashboard] Erro:", e);
      return res.status(500).json({ error: "Erro ao buscar dados do painel de afiliados" });
    }
  }

  /**
   * PATCH /api/admin/users/:id/tier
   * Admin: Promove/Rebaixa usuário para VIP
   */
  static async updateTier(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const { tier } = req.body; // "STANDARD" | "VIP"

      if (!["STANDARD", "VIP"].includes(tier)) {
        return res.status(400).json({ error: "Tier inválido. Use STANDARD ou VIP." });
      }

      if (tier === "VIP") {
        const vipCount = await AffiliateService.getVipCount();
        if (vipCount >= 50) {
          // Permite que o admin ainda assim adicione (ignora o soft cap se desejado, mas emite aviso)
          console.log(`[Affiliate] Cap de 50 VIPs excedido (${vipCount}). Promovendo via painel admin mesmo assim.`);
        }
      }

      const user = await prisma.user.update({
        where: { id },
        data: { affiliateTier: tier }
      });

      return res.json({ message: "Tier atualizado com sucesso", affiliateTier: user.affiliateTier });
    } catch (e: unknown) {
      console.error("[AffiliateController.updateTier] Erro:", e);
      return res.status(500).json({ error: "Erro ao atualizar tier do usuário" });
    }
  }
}
