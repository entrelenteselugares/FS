import { Request, Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";

export class CartorioController {
  /**
   * GET /api/unidade-fixa/stats
   * Consolida métricas financeiras e agenda para a Unidade Fixa.
   */
  static async getStats(req: AuthRequest, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Não autorizado" });
    const isAdmin = user.role === "ADMIN";
    const { startDate, endDate, cartorioName } = req.query;

    try {
      // 1. Validar existência do perfil se não for Admin
      if (!isAdmin) {
        const cartorio = await prisma.cartorio.findUnique({ where: { userId: user.userId } });
        if (!cartorio) {
          return res.status(404).json({ 
            error: "Perfil de Unidade Fixa não encontrado. Entre em contato com a administração.",
            code: "UNIDADE_NOT_FOUND" 
          });
        }
      }

      // 2. Definir o filtro de unidade
      // Se for ADMIN, pode filtrar por nome. Se for CARTORIO/UNIDADE, filtra por ele mesmo.
      const where: any = { active: true };
      
      if (!isAdmin) {
        where.cartorioUserId = user.userId;
      } else if (cartorioName) {
        where.OR = [
            { location: { contains: String(cartorioName), mode: "insensitive" } },
        ];
      }

      // Filtro de data se fornecido
      if (startDate || endDate) {
        where.dataEvento = {};
        if (startDate) where.dataEvento.gte = new Date(String(startDate));
        if (endDate) where.dataEvento.lte = new Date(String(endDate));
      }

      // 2. Buscar eventos e pedidos
      const events = await prisma.event.findMany({
        where,
        include: {
          pedidos: {
            where: { status: "APROVADO" },
          },
          cartorioUser: {
            include: { cartorio: true }
          }
        },
        orderBy: { dataEvento: "desc" }
      });

      // 3. Calcular métricas
      let totalRevenue = 0;
      let estimativaRepasse = 0;
      const agora = new Date();
      const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

      const eventosHoje = events.filter(e => {
        const d = new Date(e.dataEvento);
        return d.getFullYear() === hoje.getFullYear() &&
               d.getMonth() === hoje.getMonth() &&
               d.getDate() === hoje.getDate();
      });

      const eventosProcessados = events.map(ev => {
        const splitPct = Number(ev.cartorioUser?.cartorio?.splitPct ?? 10) / 100;
        const receitaEvento = ev.pedidos.reduce((sum, p) => sum + Number(p.valor), 0);
        const repasseEvento = receitaEvento * splitPct;

        estimativaRepasse += repasseEvento;
        totalRevenue += receitaEvento;

        return {
          id: ev.id,
          title: ev.nomeNoivos,
          date: ev.dataEvento,
          location: ev.city || ev.location,
          receita: receitaEvento,
          repasse: repasseEvento,
          _count: { orders: ev.pedidos.length },
          captacao: null 
        };
      });

      // Cálculo do mês atual
      const dataMes = new Date();
      const eventosMes = events.filter(e => {
          const d = new Date(e.dataEvento);
          return d.getMonth() === dataMes.getMonth() && d.getFullYear() === dataMes.getFullYear();
      }).length;

      // Buscar dados do cartório se não for Admin (para garantir que temos servicePrices mesmo sem eventos)
      let cartorioData = null;
      if (!isAdmin) {
        cartorioData = await prisma.cartorio.findUnique({ where: { userId: user.userId } });
      } else {
        cartorioData = events[0]?.cartorioUser?.cartorio || null;
      }

      res.json({
        totalEventos: events.length,
        totalVendas: events.reduce((acc, ev) => acc + ev.pedidos.length, 0),
        repasseEstimado: estimativaRepasse,
        eventosMes,
        razaoSocial: cartorioData?.razaoSocial || "Sua Unidade",
        cartorio: cartorioData,
        events: eventosProcessados 
      });

    } catch (error) {
      console.error("[UnidadeFixaStats Error]:", error);
      res.status(500).json({ error: "Erro ao carregar estatísticas da Unidade Fixa." });
    }
  }

  /**
   * GET /api/unidade-fixa/events
   * Listagem simples da agenda.
   */
  static async getEvents(req: AuthRequest, res: Response) {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Não autorizado" });
      try {
          const events = await prisma.event.findMany({
              where: { cartorioUserId: user.userId, active: true },
              orderBy: { dataEvento: "asc" }
          });
          res.json(events);
      } catch (error) {
          res.status(500).json({ error: "Erro ao buscar agenda da Unidade Fixa." });
      }
  }

  /**
   * GET /api/unidade-fixa/orders
   * Lista os pedidos (repasses) dos eventos desta unidade.
   */
  static async getOrders(req: AuthRequest, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Não autorizado" });

    const { startDate, endDate } = req.query;

    try {
      const isAdmin = user.role === "ADMIN";

      // Buscar os pedidos dos eventos desta unidade
      const pedidos = await prisma.order.findMany({
        where: {
          status: "APROVADO",
          event: isAdmin ? undefined : { cartorioUserId: user.userId },
          ...(startDate || endDate
            ? {
                createdAt: {
                  ...(startDate ? { gte: new Date(String(startDate)) } : {}),
                  ...(endDate ? { lte: new Date(String(endDate)) } : {}),
                },
              }
            : {}),
        },
        include: {
          event: { select: { nomeNoivos: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      const result = pedidos.map((p: any) => ({
        id: p.id,
        status: p.status,
        amount: Number(p.valor),
        splitCartorio: null,
        createdAt: p.createdAt,
        buyerEmail: null,
        event: { title: p.event?.nomeNoivos ?? "—" },
      }));

      res.json({ orders: result });
    } catch (error) {
      console.error("[UnidadeFixaOrders Error]:", error);
      res.status(500).json({ error: "Erro ao buscar pedidos da Unidade Fixa." });
    }
  }
}
