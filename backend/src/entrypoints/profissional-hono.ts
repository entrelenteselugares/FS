import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import { requireHonoAuth } from '../lib/hono-auth';
import prisma from '../lib/prisma';
import { GamificationService } from '../services/gamification.service';
import { AuthPayload } from '../lib/auth';

type Variables = {
  user: AuthPayload;
};

const app = new Hono<{ Variables: Variables }>().basePath('/api/profissional');

app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
}));

// GET /api/profissional/me — retorna dados do perfil profissional
app.get('/me', requireHonoAuth, async (c) => {
  const user = c.get('user') as AuthPayload;
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

    if (!profile) return c.json({ error: "Perfil não encontrado." }, 404);

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
    const badges = GamificationService.getProfessionalBadges(profile, isSubscriber);

    return c.json({
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
    return c.json({ error: "Erro ao buscar perfil." }, 500);
  }
});

// GET /api/profissional/events — eventos atribuídos ao profissional logado
app.get('/events', requireHonoAuth, async (c) => {
  const user = c.get('user') as AuthPayload;
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

    return c.json(events);
  } catch (err) {
    console.error("getMeusEventos:", err);
    return c.json({ error: "Erro ao buscar eventos." }, 500);
  }
});

export default handle(app);
