import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";

export class AnalyticsController {
  
  /**
   * GET /api/admin/analytics/marketplace
   * Marketplace funnel & professional ranking
   */
  static async getAdminMarketplaceAnalytics(req: AuthRequest, res: Response) {
    try {
      // 1. Totals
      const totalEvents = await prisma.event.aggregate({
        _sum: { views: true }
      });
      const totalProfileViews = await prisma.profissional.aggregate({
        _sum: { profileViews: true }
      });
      const totalLeads = await prisma.lead.count();
      const totalOrders = await prisma.order.count({
        where: { status: { in: ["PAGO", "APROVADO"] } }
      });

      // 2. Top Professionals by Conversion (Orders / Views)
      // Since order is linked to event, and event has captacaoId (the professional).
      // We will do a raw query or fetch and compute. Let's fetch all active professionals.
      const professionals = await prisma.profissional.findMany({
        where: { user: { active: true } },
        include: {
          user: { select: { nome: true } },
          _count: {
            select: { serviceBookings: true } // ServiceBookings represent bookings from profile
          }
        }
      });

      const proStats = professionals.map(p => {
        const views = p.profileViews || 0;
        const bookings = p._count.serviceBookings || 0;
        const conversion = views > 0 ? (bookings / views) * 100 : 0;
        return {
          id: p.id,
          nome: p.user.nome,
          views,
          bookings,
          conversionRate: Number(conversion.toFixed(2))
        };
      }).sort((a, b) => b.conversionRate - a.conversionRate).slice(0, 10);

      return res.json({
        funnel: {
          eventViews: totalEvents._sum.views || 0,
          profileViews: totalProfileViews._sum.profileViews || 0,
          leads: totalLeads,
          orders: totalOrders
        },
        topProfessionals: proStats
      });
    } catch (error) {
      console.error("[getAdminMarketplaceAnalytics] Error:", error);
      return res.status(500).json({ error: "Erro ao buscar analytics do marketplace." });
    }
  }

  /**
   * GET /api/admin/analytics/coupons
   * Coupon Efficiency Report
   */
  static async getAdminCouponAnalytics(req: AuthRequest, res: Response) {
    try {
      const coupons = await prisma.coupon.findMany({
        include: {
          orders: {
            where: { status: { in: ["PAGO", "APROVADO"] } },
            select: { valor: true, createdAt: true }
          }
        }
      });

      const report = coupons.map(c => {
        const orderCount = c.orders.length;
        const totalRevenue = c.orders.reduce((sum, o) => sum + Number(o.valor), 0);
        const aov = orderCount > 0 ? totalRevenue / orderCount : 0;
        
        return {
          id: c.id,
          code: c.code,
          active: c.active,
          discountType: c.isFreeShipping ? "FREE_SHIPPING" : (c.discountPct ? "PCT" : "ABS"),
          discountValue: c.discountPct || c.discountAbs || 0,
          usedCount: c.usedCount,
          successfulOrders: orderCount,
          totalRevenue,
          aov: Number(aov.toFixed(2))
        };
      }).sort((a, b) => b.totalRevenue - a.totalRevenue);

      return res.json({ coupons: report });
    } catch (error) {
      console.error("[getAdminCouponAnalytics] Error:", error);
      return res.status(500).json({ error: "Erro ao buscar analytics de cupons." });
    }
  }

  /**
   * GET /api/profissional/analytics
   */
  static async getProfissionalAnalytics(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "Não autorizado" });

      const profissional = await prisma.profissional.findUnique({
        where: { userId },
        include: {
          _count: {
            select: { serviceBookings: true }
          }
        }
      });

      if (!profissional) {
        return res.status(404).json({ error: "Profissional não encontrado." });
      }

      // Find events where they are captacao or edicao
      const events = await prisma.event.findMany({
        where: { OR: [{ captacaoId: userId }, { edicaoId: userId }] },
        select: { id: true, views: true, _count: { select: { leads: true, pedidos: { where: { status: { in: ["PAGO", "APROVADO"] } } } } } }
      });

      let totalEventViews = 0;
      let totalEventLeads = 0;
      let totalEventOrders = 0;

      events.forEach(e => {
        totalEventViews += (e.views || 0);
        totalEventLeads += e._count.leads;
        totalEventOrders += e._count.pedidos;
      });

      return res.json({
        profile: {
          views: profissional.profileViews || 0,
          bookings: profissional._count.serviceBookings || 0,
          conversionRate: profissional.profileViews > 0 ? ((profissional._count.serviceBookings || 0) / profissional.profileViews) * 100 : 0
        },
        events: {
          views: totalEventViews,
          leads: totalEventLeads,
          orders: totalEventOrders,
          conversionRate: totalEventViews > 0 ? (totalEventOrders / totalEventViews) * 100 : 0
        }
      });
    } catch (error) {
      console.error("[getProfissionalAnalytics] Error:", error);
      return res.status(500).json({ error: "Erro ao buscar analytics." });
    }
  }
}
