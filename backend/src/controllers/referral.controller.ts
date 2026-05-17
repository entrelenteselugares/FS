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
      const campaign = await ReferralService.registerVisit(slug as string, ip as string | undefined, userAgent as string | undefined);

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
    const userId = req.user?.userId;
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

  /**
   * (Phase 24) Retorna histórico paginado de conversões para o embaixador.
   */
  static async getConversionHistory(req: any, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const page = parseInt(req.query.page as string) || 1;
    try {
      const data = await ReferralService.getConversionHistory(userId, page);
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  /**
   * (Phase 24) Retorna sumário da rede (funil + ganhos por campanha).
   */
  static async getNetworkSummary(req: any, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    try {
      const data = await ReferralService.getNetworkSummary(userId);
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  /**
   * (Phase 24) Alterna status ativo/inativo de uma campanha.
   */
  static async toggleCampaign(req: any, res: Response) {
    const userId = req.user?.userId;
    const { campaignId } = req.params;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    try {
      const updated = await ReferralService.toggleCampaign(campaignId, userId);
      return res.json(updated);
    } catch (error: any) {
      return res.status(404).json({ error: error.message || "Não encontrado" });
    }
  }

  /**
   * (Phase 24) Gera ou retorna a campanha padrão do usuário.
   */
  static async generateDefaultCode(req: any, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    try {
      const slug = await ReferralService.generateCode(userId);
      const url = `${req.protocol}://${req.get('host')}/embaixador/${slug}`;
      return res.json({ slug, url });
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  /**
   * (ADMIN) Alterna o status ativo/inativo de uma campanha globalmente.
   */
  static async adminToggleCampaign(req: Request, res: Response) {
    const { campaignId } = req.params;
    try {
      const campaign = await require("../lib/prisma").prisma.referralCampaign.findUnique({
        where: { id: campaignId }
      });
      if (!campaign) {
        return res.status(404).json({ error: "Campanha não encontrada" });
      }
      const updated = await require("../lib/prisma").prisma.referralCampaign.update({
        where: { id: campaignId },
        data: { active: !campaign.active }
      });
      return res.json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: "Erro interno" });
    }
  }

  /**
   * (ADMIN) Exclui uma campanha globalmente.
   */
  static async adminDeleteCampaign(req: Request, res: Response) {
    const { campaignId } = req.params;
    try {
      // Deleta primeiro as dependências (visitas e conversões pendentes) se necessário,
      // ou se o Prisma estiver configurado com onDelete: Cascade, apenas deleta.
      await require("../lib/prisma").prisma.referralVisit.deleteMany({ where: { campaignId } });
      await require("../lib/prisma").prisma.referralConversion.deleteMany({ where: { campaignId } });
      
      await require("../lib/prisma").prisma.referralCampaign.delete({ where: { id: campaignId } });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ error: "Erro ao excluir campanha. Verifique se há restrições." });
    }
  }
}
