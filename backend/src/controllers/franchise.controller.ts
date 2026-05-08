import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from '../lib/auth';
import { SupplyService } from '../services/supply.service';
import { ReferralService } from '../services/referral.service';

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

      return res.json({
        totalEarned: Number(stats._sum.splitFranchisee || 0),
        totalOrders: stats._count.id,
        recentCommissions: recentCommissions.map(c => ({
          id: c.id,
          amount: Number(c.splitFranchisee || 0),
          eventTitle: c.event.nomeNoivos,
          date: c.updatedAt
        }))
      });
    } catch (error) {
      console.error("[Franchise Finance Error]:", error);
      return res.status(500).json({ error: "Failed to fetch financial stats" });
    }
  }
}
