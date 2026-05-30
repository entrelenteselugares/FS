import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /analytics/professional/:userId/conversion
// Returns sales conversion metrics for a professional (lookup by userId)
router.get("/professional/:userId/conversion", requireAuth, async (req: any, res) => {
  try {
    const { userId } = req.params;

    // Only allow self or admin
    if (req.user.userId !== userId && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const prof = await prisma.profissional.findUnique({
      where: { userId },
      include: { user: { select: { id: true } } },
    });

    if (!prof) {
      return res.status(404).json({ error: "Profissional não encontrado." });
    }

    const events = await prisma.event.findMany({
      where: { ownerId: userId },
      select: { id: true, title: true },
    });

    const eventIds = events.map((e) => e.id);

    const orders = await prisma.order.findMany({
      where: { eventId: { in: eventIds } },
      select: { id: true, hasPaid: true, valor: true, createdAt: true },
    });

    const totalOrders = orders.length;
    const paidOrders = orders.filter((o) => o.hasPaid);
    const totalPaidOrders = paidOrders.length;
    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.valor), 0);
    const ticketMedio = totalPaidOrders > 0 ? totalRevenue / totalPaidOrders : 0;

    // Estimated pageviews: 10x total order attempts until real tracking is added
    const pageViews = Math.max(totalOrders * 10, 1);
    const conversionRate = ((totalPaidOrders / pageViews) * 100).toFixed(2);

    return res.json({
      professionalId: prof.id,
      totalEvents: events.length,
      totalOrders,
      totalPaidOrders,
      totalRevenue,
      ticketMedio,
      pageViews,
      conversionRate,
    });
  } catch (error) {
    console.error("[Analytics] Error fetching professional conversion:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// GET /analytics/event/:id/funnel
// Returns traffic funnel analysis for an event
router.get("/event/:id/funnel", requireAuth, async (req: any, res) => {
  try {
    const { id: eventId } = req.params;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado." });
    }

    // Auth check: only owner or admin
    if (
      event.ownerId !== req.user.userId &&
      event.captacaoId !== req.user.userId &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const orders = await prisma.order.findMany({ where: { eventId } });
    const totalOrders = orders.length;
    const paidOrders = orders.filter((o) => o.hasPaid).length;

    // Estimated funnel until real telemetry is available
    const pageViews = Math.max(totalOrders * 15, 1);
    const addCart = Math.max(Math.floor(totalOrders * 0.4), totalOrders);
    const converted = paidOrders;

    return res.json({
      eventId,
      title: event.title,
      funnel: { pageViews, addCart, checkouts: totalOrders, converted },
      conversionFromView: ((converted / pageViews) * 100).toFixed(2),
      conversionFromCart:
        addCart > 0 ? ((converted / addCart) * 100).toFixed(2) : "0.00",
    });
  } catch (error) {
    console.error("[Analytics] Error fetching event funnel:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// GET /analytics/marketing/coupons
// Returns coupon efficiency report — admin only
router.get("/marketing/coupons", requireAuth, async (req: any, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const coupons = await prisma.coupon.findMany({
      include: {
        orders: {
          select: { id: true, hasPaid: true, valor: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const report = coupons.map((c) => {
      const paidOrders = c.orders.filter((o) => o.hasPaid);
      const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.valor), 0);
      return {
        id: c.id,
        code: c.code,
        discountPct: c.discountPct,
        discountAbs: c.discountAbs,
        usedCount: c.usedCount,
        actualPaidUses: paidOrders.length,
        totalRevenueGenerated: totalRevenue,
        active: c.active,
      };
    });

    report.sort((a, b) => b.totalRevenueGenerated - a.totalRevenueGenerated);

    return res.json(report);
  } catch (error) {
    console.error("[Analytics] Error fetching marketing coupons:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

export default router;
