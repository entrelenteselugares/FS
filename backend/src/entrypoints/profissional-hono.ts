import express from 'express';
import cors from 'cors';
import prisma from '../lib/prisma';
import { GamificationService } from '../services/gamification.service';
import { requireAuth } from '../lib/auth';

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));

// GET /api/profissional/me — retorna dados do perfil profissional
app.get('/me', requireAuth, async (req: any, res) => {
  const user = req.user;
  const userId = user.userId;

  try {
    const profile = await prisma.profissional.findUnique({
      where: { userId },
      include: { 
        user: { 
          select: { 
            nome: true, email: true, whatsapp: true, address: true, pixKey: true,
            isVerified: true, verificationStatus: true, profileImageUrl: true,
            franchiseProfile: { select: { printCredits: true, active: true } }
          } 
        },
        cartorios: {
          where: { status: "ACCEPTED" },
          include: { cartorio: { select: { razaoSocial: true } } }
        },
        proServices: { include: { catalog: true } }
      }
    });

    if (!profile) return res.status(404).json({ error: "Perfil não encontrado." });

    const ordersAsCaptador = await prisma.order.aggregate({
      where: { status: { in: ["PAGO", "APROVADO"] }, event: { captacaoId: userId } },
      _sum: { splitCaptacao: true }
    });
    const ordersAsEditor = await prisma.order.aggregate({
      where: { status: { in: ["PAGO", "APROVADO"] }, event: { edicaoId: userId } },
      _sum: { splitEdicao: true }
    });

    const totalEstimated = Number(ordersAsCaptador._sum.splitCaptacao ?? 0) + Number(ordersAsEditor._sum.splitEdicao ?? 0);

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthOrdersAsCaptador = await prisma.order.aggregate({
      where: { 
        status: { in: ["PAGO", "APROVADO"] }, 
        event: { captacaoId: userId },
        createdAt: { gte: firstDayOfMonth }
      },
      _sum: { splitCaptacao: true }
    });
    const monthOrdersAsEditor = await prisma.order.aggregate({
      where: { 
        status: { in: ["PAGO", "APROVADO"] }, 
        event: { edicaoId: userId },
        createdAt: { gte: firstDayOfMonth }
      },
      _sum: { splitEdicao: true }
    });

    const monthEstimated = Number(monthOrdersAsCaptador._sum.splitCaptacao ?? 0) + Number(monthOrdersAsEditor._sum.splitEdicao ?? 0);

    const completedEvents = await prisma.event.count({
      where: {
        OR: [{ captacaoId: userId }, { edicaoId: userId }],
        lightroomUrl: { not: null }
      }
    });

    const activeProSub = await prisma.subscription.findFirst({
      where: { userId, type: "PRO", status: "ACTIVE" }
    });
    const isSubscriber = !!activeProSub;
    const badges = GamificationService.getProfessionalBadges(profile as any, isSubscriber);

    return res.json({
      ...profile,
      pixKey: profile.user?.pixKey,
      isPro: isSubscriber,
      badges,
      stats: {
        totalEarnings: totalEstimated,
        monthEarnings: monthEstimated,
        completedEvents,
        agilityPoints: profile?.agilityPoints || 0
      }
    });
  } catch (err) {
    console.error("getProfile:", err);
    return res.status(500).json({ error: "Erro ao buscar perfil." });
  }
});

// GET /api/profissional/events — eventos atribuídos ao profissional logado
app.get('/events', requireAuth, async (req: any, res) => {
  const user = req.user;
  const userId = user.userId;

  try {
    const events = await prisma.event.findMany({
      where: {
        active: true,
        OR: [
          { captacaoId: userId, captacaoStatus: { not: "REJECTED" } },
          { edicaoId: userId, edicaoStatus: { not: "REJECTED" } },
          { isPublicCall: true, captacaoId: null, captacaoStatus: "PENDING" }
        ],
      },
      select: {
        id: true,
        title: true,
        dataEvento: true,
        createdAt: true,
        cartorio: true,
        coverPhotoUrl: true,
        lightroomUrl: true,
        driveUrl: true,
        temFotoImpressa: true,
        captacaoId: true,
        captacaoStatus: true,
        edicaoId: true,
        edicaoStatus: true,
        _count: { select: { pedidos: true } },
      },
      orderBy: { dataEvento: "desc" },
    });

    return res.json(events);
  } catch (err) {
    console.error("getMeusEventos:", err);
    return res.status(500).json({ error: "Erro ao buscar eventos." });
  }
});

export default app;
