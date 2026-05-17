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
  static async createCampaign(data: { 
    name: string, 
    slug: string, 
    ownerId: string, 
    rewardType: string, 
    rewardValue: number,
    targetCategories?: string[],
    targetServices?: string[]
  }) {
    return prisma.referralCampaign.create({
      data: {
        name: data.name,
        slug: data.slug,
        ownerId: data.ownerId,
        rewardType: data.rewardType as any,
        rewardValue: data.rewardValue,
        targetCategories: data.targetCategories || [],
        targetServices: data.targetServices || [],
        active: true
      }
    });
  }

  /**
   * Returns (and generates if missing) a default referral code for the user.
   */
  static async generateCode(userId: string) {
    let campaign = await prisma.referralCampaign.findFirst({
      where: { ownerId: userId, name: "Default" }
    });

    if (!campaign) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const baseName = user?.nome?.split(' ')[0].toLowerCase() || 'partner';
      const slug = `${baseName}-${Math.random().toString(36).substring(2, 7)}`;
      
      campaign = await prisma.referralCampaign.create({
        data: {
          ownerId: userId,
          name: "Default",
          slug: slug,
          rewardType: "CREDIT",
          rewardValue: 5,
          active: true
        }
      });
    }

    return campaign.slug;
  }

  /**
   * Links a new user to a referrer via code (Campaign slug or User Referral Code)
   */
  static async linkByCode(userId: string, refCode: string) {
    // 1. Tenta encontrar diretamente pelo slug da campanha
    let campaign = await prisma.referralCampaign.findUnique({
      where: { slug: refCode }
    });

    // 2. Se não encontrou por slug, pode ser o referralCode legacy do usuário (ex: 07QRXD9Z)
    if (!campaign) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: refCode },
        include: {
          referralCampaigns: {
            where: { active: true },
            orderBy: { createdAt: 'asc' },
            take: 1
          }
        }
      });
      
      // Se encontrou o usuário e ele tem uma campanha ativa (ex: "Default"), usamos ela
      if (referrer && referrer.referralCampaigns.length > 0) {
        campaign = referrer.referralCampaigns[0];
      }
    }

    if (campaign && campaign.active) {
       await this.processConversion(campaign.id, { newUserId: userId });
    }
  }

  /**
   * (Phase 24) Paginated conversion history for the ambassador dashboard timeline.
   */
  static async getConversionHistory(ownerId: string, page = 1, limit = 20) {
    const campaigns = await prisma.referralCampaign.findMany({
      where: { ownerId },
      select: { id: true, name: true, slug: true }
    });
    const campaignIds = campaigns.map(c => c.id);

    const [conversions, total] = await Promise.all([
      prisma.referralConversion.findMany({
        where: { campaignId: { in: campaignIds } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          campaign: { select: { name: true, slug: true, rewardType: true } }
        }
      }),
      prisma.referralConversion.count({
        where: { campaignId: { in: campaignIds } }
      })
    ]);

    return {
      conversions: conversions.map(c => ({
        id: c.id,
        campaignName: c.campaign.name,
        campaignSlug: c.campaign.slug,
        rewardType: c.campaign.rewardType,
        rewardAmount: Number(c.rewardAmount),
        status: c.status,
        createdAt: c.createdAt,
        hasOrder: !!c.orderId,
        hasNewUser: !!c.newUserId,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * (Phase 24) Network summary: total earnings breakdown per campaign and overall funnel.
   */
  static async getNetworkSummary(ownerId: string) {
    const campaigns = await prisma.referralCampaign.findMany({
      where: { ownerId },
      include: {
        _count: { select: { visits: true, conversions: true } },
        conversions: { select: { rewardAmount: true, status: true } }
      }
    });

    const summary = campaigns.map(c => {
      const paid   = c.conversions.filter(cv => cv.status === "PAID");
      const pending = c.conversions.filter(cv => cv.status === "PENDING");
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        rewardType: c.rewardType,
        rewardValue: Number(c.rewardValue),
        active: c.active,
        visits: c._count.visits,
        conversions: c._count.conversions,
        conversionRate: c._count.visits > 0
          ? ((c._count.conversions / c._count.visits) * 100).toFixed(1)
          : "0.0",
        earnedPaid: paid.reduce((s, cv) => s + Number(cv.rewardAmount), 0),
        earnedPending: pending.reduce((s, cv) => s + Number(cv.rewardAmount), 0),
      };
    });

    const totals = {
      visits:       summary.reduce((s, c) => s + c.visits, 0),
      conversions:  summary.reduce((s, c) => s + c.conversions, 0),
      earnedPaid:   summary.reduce((s, c) => s + c.earnedPaid, 0),
      earnedPending:summary.reduce((s, c) => s + c.earnedPending, 0),
      campaigns:    summary.length,
    };

    return { campaigns: summary, totals };
  }

  /**
   * (Phase 24) Toggle campaign active/inactive.
   */
  static async toggleCampaign(campaignId: string, ownerId: string) {
    const campaign = await prisma.referralCampaign.findFirst({
      where: { id: campaignId, ownerId }
    });
    if (!campaign) throw new Error("Campanha não encontrada ou sem permissão.");

    return prisma.referralCampaign.update({
      where: { id: campaignId },
      data: { active: !campaign.active }
    });
  }
}
