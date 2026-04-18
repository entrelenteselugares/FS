import { Request, Response } from "express";
import prisma from "../lib/prisma";

export class CartorioController {
  /**
   * GET /api/cartorio/stats
   * Consolida métricas financeiras e agenda para o Cartório.
   */
  static async getStats(req: Request, res: Response) {
    const user = (req as any).user;
    const isAdmin = user.role === "ADMIN";
    const { startDate, endDate, cartorioName } = req.query;

    try {
      // 1. Validar existência do perfil se não for Admin
      if (!isAdmin) {
        const cartorio = await prisma.cartorio.findUnique({ where: { userId: user.userId } });
        if (!cartorio) {
          return res.status(404).json({ 
            error: "Perfil de cartório não encontrado. Entre em contato com a administração.",
            code: "CARTORIO_NOT_FOUND" 
          });
        }
      }

      // 2. Definir o filtro de unidade
      // Se for ADMIN, pode filtrar por nome. Se for CARTORIO, filtra por ele mesmo.
      const where: any = { active: true };
      
      if (!isAdmin) {
        where.cartorioUserId = user.userId;
      } else if (cartorioName) {
        where.OR = [
            { location: { contains: String(cartorioName), mode: "insensitive" } },
            // Caso o nome noivos ou outro campo ajude no filtro administrativo
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
          captacao: null // Futuro: vincular profissional
        };
      });

      // Cálculo do mês atual
      const dataMes = new Date();
      const eventosMes = events.filter(e => {
          const d = new Date(e.dataEvento);
          return d.getMonth() === dataMes.getMonth() && d.getFullYear() === dataMes.getFullYear();
      }).length;

      res.json({
        totalEventos: events.length,
        totalVendas: events.reduce((acc, ev) => acc + ev.pedidos.length, 0),
        repasseEstimado: estimativaRepasse,
        eventosMes,
        razaoSocial: events[0]?.cartorioUser?.cartorio?.razaoSocial || "Sua Unidade",
        events: eventosProcessados // Compatibilidade com a listagem
      });

    } catch (error) {
      console.error("[CartorioStats Error]:", error);
      res.status(500).json({ error: "Erro ao carregar estatísticas do cartório." });
    }
  }

  /**
   * GET /api/cartorio/events
   * Listagem simples da agenda.
   */
  static async getEvents(req: Request, res: Response) {
      const user = (req as any).user;
      try {
          const events = await prisma.event.findMany({
              where: { cartorioUserId: user.userId, active: true },
              orderBy: { dataEvento: "asc" }
          });
          res.json(events);
      } catch (error) {
          res.status(500).json({ error: "Erro ao buscar agenda." });
      }
  }
}
