import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from '../lib/auth';
import { SupplyService } from '../services/supply.service';
import { ReferralService } from '../services/referral.service';
import { MercadoPagoService } from "../services/mercadopago.service";
import { APP_URL } from "../lib/config";

export class FranchiseController {
  /**
   * Lista todos os usuários com FranchiseProfile (independente do role).
   * Se o próprio franqueado chamar, recebe apenas os seus dados.
   */
  static async listAll(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      // Filtra por userId se o chamador for o próprio franqueado
      const profileWhere: any = {};
      if (user.role !== 'ADMIN') {
        profileWhere.userId = user.userId;
      }

      const franchisees = await prisma.user.findMany({
        where: {
          franchiseProfile: { isNot: null, ...profileWhere }
        },
        include: {
          franchiseProfile: {
            include: {
              events: { select: { id: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, franchisees });
    } catch (error) {
      res.status(500).json({ error: "Erro ao listar franqueados." });
    }
  }

  /**
   * Ativa a capacidade de franquia para um usuário EXISTENTE.
   * NÃO altera o role — o fotógrafo continua como PROFISSIONAL.
   */
  static async promote(req: Request, res: Response) {
    try {
      const { userId, baseCep } = req.body;

      // Só cria/ativa o FranchiseProfile, sem tocar no role
      const profile = await prisma.franchiseProfile.upsert({
        where: { userId },
        create: { userId, printCredits: 0, active: true, baseCep },
        update: { active: true, baseCep }
      });

      res.json({ success: true, profile });
    } catch (error) {
      res.status(500).json({ error: "Erro ao ativar franquia." });
    }
  }

  /**
   * Atualiza as configurações do perfil de franquia (Ex: CEP Base)
   */
  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const { baseCep, inventoryAlertThreshold } = req.body;
      const userId = req.user!.userId;

      const profile = await prisma.franchiseProfile.update({
        where: { userId },
        data: { 
          baseCep, 
          inventoryAlertThreshold: inventoryAlertThreshold ? Number(inventoryAlertThreshold) : undefined 
        }
      });

      res.json({ success: true, profile });
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar perfil de franquia." });
    }
  }

  /**
   * Atualiza as configurações de marca (White-Label) do Franqueado no modelo User
   */
  static async updateBranding(req: AuthRequest, res: Response) {
    try {
      const { tenantLogoUrl, tenantBrandColor } = req.body;
      const userId = req.user!.userId;

      const user = await prisma.user.update({
        where: { id: userId },
        data: { 
          tenantLogoUrl: tenantLogoUrl || null,
          tenantBrandColor: tenantBrandColor || null
        }
      });

      res.json({ success: true, user: { tenantLogoUrl: user.tenantLogoUrl, tenantBrandColor: user.tenantBrandColor } });
    } catch (error) {
      console.error("[updateBranding] Error:", error);
      res.status(500).json({ error: "Erro ao atualizar configurações de marca." });
    }
  }

  /**
   * Alterna o status ativo/inativo de um FranchiseProfile
   */
  static async toggleActive(req: Request, res: Response) {
    try {
      const profileId = String(req.params.profileId);
      const { active } = req.body;

      const profile = await prisma.franchiseProfile.update({
        where: { id: profileId },
        data: { active }
      });

      res.json({ success: true, profile });
    } catch (error) {
      res.status(500).json({ error: "Erro ao alterar status da franquia." });
    }
  }

  /**
   * Remove o FranchiseProfile sem afetar o role do usuário.
   * Agora lida com as dependências (eventos, prints, transações).
   */
  static async remove(req: Request, res: Response) {
    try {
      const profileId = String(req.params.profileId);

      await prisma.$transaction([
        // 1. Deleta histórico de créditos (depende diretamente do profile)
        prisma.creditTransaction.deleteMany({ where: { profileId } }),
        
        // 2. Desvincula eventos (seta franchiseeId para null)
        prisma.event.updateMany({
          where: { franchiseeId: profileId },
          data: { franchiseeId: null }
        }),
        
        // 3. Desvincula histórico de impressões phygital
        prisma.phygitalPrint.updateMany({
          where: { franchiseProfileId: profileId },
          data: { franchiseProfileId: null }
        }),
        
        // 4. Finalmente remove o perfil
        prisma.franchiseProfile.delete({ where: { id: profileId } })
      ]);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro ao remover franquia:", error);
      res.status(500).json({ error: "Erro ao remover franquia.", details: error.message });
    }
  }

  /**
   * Adiciona créditos a um franqueado
   */
  static async addCredits(req: Request, res: Response) {
    try {
      const { profileId, amount, description } = req.body;

      const transaction = await prisma.$transaction([
        prisma.franchiseProfile.update({
          where: { id: profileId },
          data: { printCredits: { increment: amount } }
        }),
        prisma.creditTransaction.create({
          data: {
            profileId,
            amount,
            type: 'RECHARGE',
            description: description || "Recarga de Pacote de Impressão"
          }
        })
      ]);

      res.json({ success: true, profile: transaction[0] });
    } catch (error) {
      res.status(500).json({ error: "Erro ao adicionar créditos." });
    }
  }

  /**
   * Busca o extrato de um franqueado
   */
  static async getStatement(req: Request, res: Response) {
    try {
      const profileId = String(req.params.profileId);
      const transactions = await prisma.creditTransaction.findMany({
        where: { profileId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      res.json({ success: true, transactions });
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar extrato." });
    }
  }

  // ── B2B HUB DASHBOARD METHODS ──────────────────────────────────────────────

  /**
   * Returns inventory status and low-stock alerts
   */
  static async getInventory(req: AuthRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: { franchiseProfile: true }
      });

      if (!user?.franchiseProfile) {
        return res.status(403).json({ error: "Access denied. Not a franchisee." });
      }

      const inventory = await SupplyService.getFranchiseInventory(user.franchiseProfile.id);
      return res.json(inventory);
    } catch (error) {
      console.error("[Franchise Inventory Error]:", error);
      return res.status(500).json({ error: "Failed to fetch inventory status" });
    }
  }

  /**
   * Triggers a 1-click supply reorder
   */
  static async postReorder(req: AuthRequest, res: Response) {
    const { packType } = req.body;
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: { franchiseProfile: true }
      });

      if (!user?.franchiseProfile) {
        return res.status(403).json({ error: "Access denied." });
      }

      const order = await SupplyService.createSupplyOrder(user.franchiseProfile.id, packType);
      return res.status(201).json(order);
    } catch (error) {
      console.error("[Franchise Reorder Error]:", error);
      return res.status(500).json({ error: "Failed to generate supply order" });
    }
  }

  /**
   * Returns (and generates) the referral code for the franchisee
   */
  static async getReferralCode(req: AuthRequest, res: Response) {
    try {
      const code = await ReferralService.generateCode(req.user!.userId);
      return res.json({ code });
    } catch (error) {
      console.error("[Franchise Referral Error]:", error);
      return res.status(500).json({ error: "Failed to manage referral code" });
    }
  }

  /**
   * Returns the list of photographers in the franchisee's network
   */
  static async getNetwork(req: AuthRequest, res: Response) {
    try {
      const network = await prisma.professionalNetwork.findMany({
        where: { partnerId: req.user!.userId },
        include: {
          user: {
            select: {
              id: true,
              nome: true,
              email: true,
              isVerified: true,
              verificationStatus: true,
              profissional: {
                select: {
                  experienceYears: true
                }
              }
            }
          }
        }
      });

      return res.json(network);
    } catch (error) {
      console.error("[Franchise Network Error]:", error);
      return res.status(500).json({ error: "Failed to fetch network partners" });
    }
  }

  /**
   * Returns financial statistics (Passive Income) for the franchisee
   */
  static async getFinanceStats(req: AuthRequest, res: Response) {
    try {
      const stats = await prisma.order.aggregate({
        where: {
          passiveFranchiseeId: req.user!.userId,
          status: "APROVADO"
        },
        _sum: {
          splitFranchisee: true
        },
        _count: {
          id: true
        }
      });

      const recentCommissions = await prisma.order.findMany({
        where: {
          passiveFranchiseeId: req.user!.userId,
          status: "APROVADO"
        },
        include: {
          event: { select: { nomeNoivos: true } }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      });

      // Phase 41: Cohort Metrics
      const networkIds = await prisma.professionalNetwork.findMany({
        where: { partnerId: req.user!.userId },
        select: { userId: true }
      }).then(res => res.map(r => r.userId));

      let networkEventsCount = 0;
      let networkOrdersCount = 0;
      let conversionRate = 0;

      if (networkIds.length > 0) {
        networkEventsCount = await prisma.event.count({
          where: { captacaoId: { in: networkIds } }
        });

        networkOrdersCount = await prisma.order.count({
          where: { 
            event: { captacaoId: { in: networkIds } },
            status: "APROVADO"
          }
        });

        if (networkEventsCount > 0) {
          // Average orders per event across the network
          conversionRate = networkOrdersCount / networkEventsCount;
        }
      }

      return res.json({
        totalEarned: Number(stats._sum.splitFranchisee || 0),
        totalOrders: stats._count.id,
        recentCommissions: recentCommissions.map(c => ({
          id: c.id,
          amount: Number(c.splitFranchisee || 0),
          eventTitle: c.event.nomeNoivos,
          date: c.updatedAt
        })),
        intel: {
          networkEvents: networkEventsCount,
          networkOrders: networkOrdersCount,
          avgOrdersPerEvent: conversionRate.toFixed(2)
        }
      });
    } catch (error) {
      console.error("[Franchise Finance Error]:", error);
      return res.status(500).json({ error: "Failed to fetch financial stats" });
    }
  }

  /**
   * Phase 41: Export Financial Data as CSV
   */
  static async exportFinance(req: AuthRequest, res: Response) {
    try {
      const { start, end } = req.query;
      
      const whereClause: any = {
        passiveFranchiseeId: req.user!.userId,
        status: "APROVADO",
      };

      if (start && end) {
        whereClause.updatedAt = {
          gte: new Date(start as string),
          lte: new Date(end as string)
        };
      }

      const orders = await prisma.order.findMany({
        where: whereClause,
        include: {
          event: { select: { nomeNoivos: true } },
          cliente: { select: { nome: true, email: true } }
        },
        orderBy: { updatedAt: 'desc' }
      });

      if (orders.length === 0) {
        return res.status(404).json({ error: "Nenhum dado financeiro encontrado no período." });
      }

      // Generate CSV
      let csv = "ID do Pedido,Data,Evento,Cliente,Email do Cliente,Valor Total (R$),Comissao Franquia (R$)\n";
      
      orders.forEach(o => {
        const dateStr = o.updatedAt.toISOString().split('T')[0];
        const eventName = o.event?.nomeNoivos ? `"${o.event.nomeNoivos}"` : "N/A";
        const clientName = o.cliente?.nome ? `"${o.cliente.nome}"` : "N/A";
        const clientEmail = o.cliente?.email ? `"${o.cliente.email}"` : "N/A";
        const total = Number(o.valor).toFixed(2);
        const commission = Number(o.splitFranchisee || 0).toFixed(2);

        csv += `${o.id},${dateStr},${eventName},${clientName},${clientEmail},${total},${commission}\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="fechamento_franquia.csv"');
      
      return res.send(csv);
    } catch (error) {
      console.error("[Franchise Export Error]:", error);
      return res.status(500).json({ error: "Failed to export financial data" });
    }
  }

  /**
   * Cria um novo pedido de suprimentos/créditos (B2B Shop)
   */
  static async createSupplyOrder(req: AuthRequest, res: Response) {
    try {
      const { items, total, deliveryType, paymentMethod, address } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      // 1. Cria o pedido no banco usando o novo modelo SupplyOrder
      const order = await prisma.supplyOrder.create({
        data: {
          franchiseeId: userId,
          total: Number(total),
          paymentMethod,
          deliveryType,
          address,
          status: "PENDING",
          items: {
            create: items.map((it: any) => ({
              productId: it.id,
              name: it.name,
              price: it.price,
              quantity: it.quantity,
            })),
          },
        },
        include: { items: true },
      });

      return res.status(201).json({ 
        order, 
        message: paymentMethod === "BALANCE" 
          ? "Pedido registrado com sucesso. Aguardando abatimento no repasse."
          : "Pedido registrado com sucesso."
      });

    } catch (error: unknown) {
      console.error("[Franchise CreateOrder Error]:", error);
      res.status(500).json({ error: "Erro ao processar pedido de suprimentos" });
    }
  }

  /**
   * Webhook para processar o status do pagamento do Mercado Pago para pedidos B2B
   */
  static async handleWebhook(req: any, res: Response) {
    const { action, data, type } = req.body;
    const paymentId = data?.id || req.query?.id;

    if (paymentId && (type === "payment" || action?.includes("payment"))) {
      try {
        const payment = await MercadoPagoService.getPaymentStatus(paymentId);
        
        if (payment.status === "approved") {
          const orderId = payment.metadata.order_id || payment.external_reference?.split(":")[0];
          
          if (!orderId) return res.sendStatus(200);

          const order = await prisma.supplyOrder.findUnique({
            where: { id: orderId },
            include: { items: true }
          });

          if (order && order.status !== "PAID") {
            await prisma.supplyOrder.update({
              where: { id: orderId },
              data: { status: "PAID" }
            });

            // Adicionar créditos se houver recargas no pedido
            for (const item of order.items) {
              if (item.productId.includes("credits")) {
                const creditsMatch = item.productId.match(/\d+/);
                const amountToAdd = (creditsMatch ? parseInt(creditsMatch[0]) : 0) * item.quantity;
                
                if (amountToAdd > 0) {
                  const profile = await prisma.franchiseProfile.findUnique({ where: { userId: order.franchiseeId } });
                  if (profile) {
                    await prisma.franchiseProfile.update({
                      where: { id: profile.id },
                      data: { printCredits: { increment: amountToAdd } }
                    });
                    
                    await prisma.creditTransaction.create({
                      data: {
                        profileId: profile.id,
                        amount: amountToAdd,
                        type: "PURCHASE",
                        description: `Recarga via Loja - Pedido #${order.id}`,
                        referenceId: order.id
                      }
                    });
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("[Franchise Webhook Error]:", err);
      }
    }
    res.sendStatus(200);
  }

  /**
   * Lista pedidos de suprimentos do franqueado logado
   */
  static async listSupplyOrders(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "Não autorizado" });

      const orders = await prisma.supplyOrder.findMany({
        where: { franchiseeId: userId },
        include: { items: true },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, orders });
    } catch (error) {
      console.error("[listSupplyOrders] Error:", error);
      res.status(500).json({ error: "Erro ao listar pedidos de suprimentos" });
    }
  }

  /**
   * Admin: Lista TODOS os pedidos de suprimentos da rede
   */
  static async adminListSupplyOrders(_req: Request, res: Response) {
    try {
      const orders = await prisma.supplyOrder.findMany({
        include: { 
          items: true,
          franchisee: { select: { nome: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, orders });
    } catch (error) {
      console.error("[adminListSupplyOrders] Error:", error);
      res.status(500).json({ error: "Erro ao listar pedidos da rede" });
    }
  }

  /**
   * Admin: Atualiza status de um pedido de suprimentos (Ex: Marcar como enviado)
   */
  static async adminUpdateSupplyOrderStatus(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const status = req.body.status as string;

      // 1. Busca o pedido com os itens e o franqueado
      const currentOrder = await prisma.supplyOrder.findUnique({
        where: { id },
        include: { items: true, franchisee: { include: { franchiseProfile: true } } }
      });

      if (!currentOrder) return res.status(404).json({ error: "Pedido não encontrado" });

      // 2. Se o status está mudando para PAID, e antes não estava, adiciona créditos se houver
      const wasPaid = currentOrder.status === 'PAID';
      const isNowPaid = status === 'PAID';

      if (isNowPaid && !wasPaid) {
        // Lógica de créditos (digital)
        for (const item of currentOrder.items) {
          if (item.productId.startsWith('credits_')) {
            const amountStr = item.productId.split('_')[1];
            const amount = parseInt(amountStr) * item.quantity;
            if (currentOrder.franchisee.franchiseProfile) {
              await prisma.$transaction([
                prisma.franchiseProfile.update({
                  where: { id: currentOrder.franchisee.franchiseProfile.id },
                  data: { printCredits: { increment: amount } }
                }),
                prisma.creditTransaction.create({
                  data: {
                    profileId: currentOrder.franchisee.franchiseProfile.id,
                    amount: amount,
                    type: 'PURCHASE',
                    description: `Recarga via Pedido #${currentOrder.id.slice(-6).toUpperCase()}`
                  }
                })
              ]);
            }
          }
        }
      }

      // 3. Se o status está mudando para SHIPPED, e antes não estava, deduz estoque da Matriz (físico)
      const wasShipped = currentOrder.status === 'SHIPPED';
      const isNowShipped = status === 'SHIPPED';

      if (isNowShipped && !wasShipped) {
        for (const item of currentOrder.items) {
          // Busca o produto na tabela central (Matriz) pelo SKU
          const product = await prisma.printProduct.findUnique({ where: { sku: item.productId } });
          if (product) {
            await prisma.$transaction([
              prisma.printProduct.update({
                where: { id: product.id },
                data: { stockLevel: { decrement: item.quantity } }
              }),
              prisma.stockMovement.create({
                data: {
                  productId: product.id,
                  quantity: -item.quantity,
                  type: 'SALE',
                  description: `Venda para franqueado: Pedido #${currentOrder.id.slice(-6).toUpperCase()}`
                }
              })
            ]);
          }
        }
      }

      const order = await prisma.supplyOrder.update({
        where: { id },
        data: { 
          status,
          ...(isNowShipped && req.body.trackingCode ? { trackingCode: req.body.trackingCode } : {}),
          ...(isNowShipped && req.body.shippingNotes ? { shippingNotes: req.body.shippingNotes } : {}),
        }
      });

      res.json({ success: true, order });
    } catch (error) {
      console.error("[adminUpdateSupplyOrderStatus] Error:", error);
      res.status(500).json({ error: "Erro ao atualizar status do pedido" });
    }
  }
}
