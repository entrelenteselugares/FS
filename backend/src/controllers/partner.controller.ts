import { Request, Response } from "express";
import { AuthRequest } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { audit } from "../lib/audit";

/**
 * GET /api/public/partners/:slug
 * Retorna dados detalhados do parceiro para a Landing Page
 */
export async function getPartnerLandingData(req: Request, res: Response): Promise<void> {
  const { slug } = req.params;

  try {
    const partner = await prisma.cartorio.findUnique({
      where: { slug: String(slug) },
      include: {
        user: {
          select: {
            nome: true,
            email: true,
          }
        }
      }
    });

    if (!partner) {
      res.status(404).json({ error: "Parceiro não encontrado." });
      return;
    }

    // Busca os últimos 6 eventos públicos realizados neste local
    const recentEvents = await prisma.event.findMany({
      where: {
        cartorioUserId: partner.userId,
        active: true,
        coverPhotoUrl: { not: null }
      },
      select: {
        id: true,
        nomeNoivos: true,
        slug: true,
        dataEvento: true,
        coverPhotoUrl: true,
      },
      orderBy: { dataEvento: "desc" },
      take: 6,
    });

    res.json({
      partner: {
        id: partner.id,
        userId: partner.userId,
        razaoSocial: partner.razaoSocial,
        slug: partner.slug,
        address: partner.address,
        phone: partner.phone,
        description: partner.description,
        coverUrl: partner.coverUrl,
        servicePrices: partner.servicePrices,
        disabledServices: partner.disabledServices || [],
        workingHours: partner.workingHours,
        fixedDuration: partner.fixedDuration,
      },
      recentEvents,
    });
  } catch (err) {
    console.error("getPartnerLandingData:", err);
    res.status(500).json({ error: "Erro ao buscar dados do parceiro." });
  }
}

/**
 * PATCH /api/partner/profile 
 * Permite que o próprio cartório atualize seus dados de Landing Page
 */
export async function updatePartnerProfile(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { address, phone, description, coverUrl, slug, pixKey, servicePrices, fixedDuration, fixedTime, hideDuration, workingHours, disabledServices } = req.body;

  try {
    interface CartorioBefore {
      address: string | null;
      phone: string | null;
      user: { pixKey: string | null } | null;
    }

    const before = await prisma.cartorio.findUnique({
      where: { userId },
      include: { user: { select: { pixKey: true } } }
    }) as CartorioBefore | null;

    const updated = await prisma.cartorio.update({
      where: { userId },
      data: {
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(description !== undefined && { description }),
        ...(coverUrl !== undefined && { coverUrl }),
        ...(slug !== undefined && { slug }),
        ...(servicePrices !== undefined && { servicePrices }),
        ...(fixedDuration !== undefined && { fixedDuration: Number(fixedDuration) }),
        ...(fixedTime !== undefined && { fixedTime: Boolean(fixedTime) }),
        ...(hideDuration !== undefined && { hideDuration: Boolean(hideDuration) }),
        ...(workingHours !== undefined && { workingHours }),
        ...(disabledServices !== undefined && { disabledServices }),
        user: {
          update: {
            ...(pixKey !== undefined && { pixKey })
          }
        }
      }
    });

    // P1 — Perfil da unidade: audit obrigatório para mudanças em dados públicos e bancários
    await audit(req, "CARTORIO_PROFILE_UPDATED", "Cartorio", userId, 
      { address: before?.address, phone: before?.phone, pixKey: before?.user?.pixKey },
      { address, phone, pixKey }
    );

    res.json(updated);
  } catch (err) {
    console.error("updatePartnerProfile:", err);
    res.status(500).json({ error: "Erro ao atualizar perfil do parceiro." });
  }
}
