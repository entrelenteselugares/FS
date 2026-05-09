import prisma from "../lib/prisma";

export class ReferralService {
  /**
   * Registra uma visita a uma campanha de embaixador.
   */
  static async registerVisit(slug: string, ip?: string, userAgent?: string) {
    const campaign = await prisma.referralCampaign.findUnique({
      where: { slug, active: true },
    });

    if (!campaign) return null;

    await prisma.referralVisit.create({
      data: {
        campaignId: campaign.id,
        ip,
        userAgent,
      },
    });

    return campaign;
  }

  /**
   * Processa uma conversão (cadastro ou compra).
   */
  static async processConversion(campaignId: string, data: { newUserId?: string; orderId?: string }) {
    const campaign = await prisma.referralCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign || !campaign.active) return;

    // Criar a conversão
    const conversion = await prisma.referralConversion.create({
      data: {
        campaignId: campaign.id,
        newUserId: data.newUserId,
        orderId: data.orderId,
        rewardAmount: campaign.rewardValue,
        status: "PENDING",
      },
    });

    // Se for crédito imediato, podemos processar aqui ou via worker
    if (campaign.rewardType === "CREDIT" && data.newUserId) {
      await this.applyCredit(campaign.ownerId, campaign.rewardValue, `Recompensa por indicação: ${campaign.name}`);
      await prisma.referralConversion.update({
        where: { id: conversion.id },
        data: { status: "PAID" },
      });
    }

    return conversion;
  }

  /**
   * Aplica crédito ao embaixador via GamificationLedger.
   */
  private static async applyCredit(userId: string, amount: any, description: string) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { rewardCredits: { increment: amount } },
      }),
      prisma.gamificationLedger.create({
        data: {
          userId,
          type: "REFERRAL_REWARD",
          amount,
          description,
        },
      }),
    ]);
  }

  /**
   * Retorna estatísticas de uma campanha para o dashboard.
   */
  static async getCampaignStats(ownerId: string) {
    const campaigns = await prisma.referralCampaign.findMany({
      where: { ownerId },
      include: {
        _count: {
          select: { visits: true, conversions: true },
        },
      },
    });

    return campaigns.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      rewardType: c.rewardType,
      rewardValue: c.rewardValue,
      visits: c._count.visits,
      conversions: c._count.conversions,
      active: c.active,
    }));
  }

  /**
   * (ADMIN) Listagem global de todas as campanhas.
   */
  static async listAllCampaigns() {
    return prisma.referralCampaign.findMany({
      include: {
        owner: { select: { nome: true, email: true } },
        _count: { select: { visits: true, conversions: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * (ADMIN) Cria uma nova campanha para um usuário.
   */
  static async createCampaign(data: { name: string, slug: string, ownerId: string, rewardType: string, rewardValue: number }) {
    return prisma.referralCampaign.create({
      data: {
        name: data.name,
        slug: data.slug,
        ownerId: data.ownerId,
        rewardType: data.rewardType as any,
        rewardValue: data.rewardValue,
        active: true
      }
    });
  }
}
