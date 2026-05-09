import { Request, Response } from "express";
import { ReferralService } from "../services/referral.service";

export class ReferralController {
  /**
   * Captura o clique do embaixador e redireciona.
   */
  static async handleReferral(req: Request, res: Response) {
    const { slug } = req.params;
    const ip = req.ip;
    const userAgent = req.get("user-agent");

    try {
      const campaign = await ReferralService.registerVisit(slug, ip, userAgent);

      if (!campaign) {
        return res.redirect("/"); // Campanha não encontrada ou inativa
      }

      // Setar cookie fs_referral (30 dias)
      res.cookie("fs_referral", campaign.id, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      // Redirecionar para a home (ou landing page se houver no futuro)
      return res.redirect("/");
    } catch (error) {
      console.error("[ReferralController] Error:", error);
      return res.redirect("/");
    }
  }

  /**
   * Retorna estatísticas para o dashboard do embaixador.
   */
  static async getStats(req: any, res: Response) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
      const stats = await ReferralService.getCampaignStats(userId);
      return res.json(stats);
    } catch (error) {
      console.error("[ReferralController] Stats Error:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  /**
   * (ADMIN) Listagem global de campanhas.
   */
  static async listAllCampaigns(req: Request, res: Response) {
    try {
      const campaigns = await ReferralService.listAllCampaigns();
      return res.json(campaigns);
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  /**
   * (ADMIN) Cria uma nova campanha.
   */
  static async createCampaign(req: Request, res: Response) {
    try {
      const campaign = await ReferralService.createCampaign(req.body);
      return res.status(201).json(campaign);
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
