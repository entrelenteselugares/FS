import { Request, Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";

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
      const where: Prisma.EventWhereInput = { active: true };
      
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
            include: { 
              cartorio: {
                include: {
                  profissionais: {
                    where: { tipo: "FIXO" },
                    include: {
                      profissional: {
                        include: { user: { select: { nome: true } } }
                      }
                    }
                  }
                }
              } 
            }
          },
          captacao: {
            select: { nome: true }
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
          title: ev.title,
          date: ev.dataEvento,
          city: ev.city || ev.cartorioUser?.cartorio?.cidade || null,
          location: ev.location,
          receita: receitaEvento,
          repasse: repasseEvento,
          _count: { orders: ev.pedidos.length },
          captacao: ev.captacao || (ev.cartorioUser?.cartorio?.profissionais?.length 
            ? { nome: ev.cartorioUser.cartorio.profissionais.map(p => p.profissional.user.nome).join(", ") }
            : null)
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
        cartorioData = await prisma.cartorio.findUnique({ 
          where: { userId: user.userId },
          include: { 
            user: { 
              select: { 
                pixKey: true,
                tenantLogoUrl: true,
                tenantBrandColor: true,
                franchiseProfile: {
                  select: {
                    tier: true,
                    approvedSalesVolume: true
                  }
                }
              } 
            } 
          }
        });
      } else {
        cartorioData = events[0]?.cartorioUser?.cartorio || null;
      }

      res.json({
        totalEventos: events.length,
        totalVendas: events.reduce((acc, ev) => acc + ev.pedidos.length, 0),
        repasseEstimado: estimativaRepasse,
        eventosMes,
        razaoSocial: cartorioData?.razaoSocial || "Sua Unidade",
        pixKey: (cartorioData as { user?: { pixKey?: string | null } } | null)?.user?.pixKey || "",
        user: (cartorioData as any)?.user || null,
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
              include: {
                captacao: {
                  select: { nome: true, email: true }
                },
                cartorioUser: {
                  include: {
                    cartorio: {
                      include: {
                        profissionais: {
                          where: { tipo: "FIXO" },
                          include: {
                            profissional: {
                              include: { user: { select: { nome: true } } }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              orderBy: { dataEvento: "asc" }
          });

          const result = events.map(ev => ({
            ...ev,
            city: ev.city || (ev as any).cartorioUser?.cartorio?.cidade || null,
            title: ev.title,
            date: ev.dataEvento,
            captacao: ev.captacao || (ev.cartorioUser?.cartorio?.profissionais?.length
              ? { nome: ev.cartorioUser.cartorio.profissionais.map(p => p.profissional.user.nome).join(", ") }
              : null)
          }));

          res.json(result);
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
          event: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      const result = pedidos.map((p) => ({
        id: p.id,
        status: p.status,
        amount: Number(p.valor),
        splitCartorio: null,
        createdAt: p.createdAt,
        buyerEmail: null,
        event: { title: p.event?.title ?? "—" },
      }));

      res.json({ orders: result });
    } catch (error) {
      console.error("[UnidadeFixaOrders Error]:", error);
      res.status(500).json({ error: "Erro ao buscar pedidos da Unidade Fixa." });
    }
  }

  /**
   * GET /api/unidade-fixa/finance/export
   * Exporta em formato CSV os repasses aprovados da Unidade Fixa.
   */
  static async exportFinance(req: AuthRequest, res: Response) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Não autorizado" });

    const { startDate, endDate } = req.query;

    try {
      const isAdmin = user.role === "ADMIN";

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
          event: { select: { title: true, cartorioUser: { select: { cartorio: { select: { splitPct: true } } } } } },
          cliente: { select: { nome: true, email: true } }
        },
        orderBy: { createdAt: "desc" },
      });

      if (pedidos.length === 0) {
        return res.status(404).json({ error: "Nenhum dado financeiro encontrado no período." });
      }

      // Generate CSV
      let csv = "ID do Pedido,Data,Evento,Cliente,Email do Cliente,Valor Total (R$),Comissao Unidade (R$)\n";
      
      pedidos.forEach(p => {
        const dateStr = p.createdAt.toISOString().split('T')[0];
        const eventName = p.event?.title ? `"${p.event.title}"` : "N/A";
        const clientName = p.cliente?.nome ? `"${p.cliente.nome}"` : "N/A";
        const clientEmail = p.cliente?.email ? `"${p.cliente.email}"` : "N/A";
        const total = Number(p.valor).toFixed(2);
        
        // Calcular o split: O valor recebido pela Unidade Fixa (se não estiver salvo no pedido, deduzimos da porcentagem)
        const splitPct = Number(p.event?.cartorioUser?.cartorio?.splitPct ?? 10) / 100;
        const comissao = (Number(p.valor) * splitPct).toFixed(2);

        csv += `${p.id},${dateStr},${eventName},${clientName},${clientEmail},${total},${comissao}\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="fechamento_unidade_fixa.csv"');
      
      return res.send(csv);
    } catch (error) {
      console.error("[UnidadeFixaExport Error]:", error);
      res.status(500).json({ error: "Erro ao exportar dados financeiros da Unidade Fixa." });
    }
  }
}
