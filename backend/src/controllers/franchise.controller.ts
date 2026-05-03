import { Request, Response } from "express";
import prisma from "../lib/prisma";

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
      const { userId } = req.body;

      // Só cria/ativa o FranchiseProfile, sem tocar no role
      const profile = await prisma.franchiseProfile.upsert({
        where: { userId },
        create: { userId, printCredits: 0, active: true },
        update: { active: true }
      });

      res.json({ success: true, profile });
    } catch (error) {
      res.status(500).json({ error: "Erro ao ativar franquia." });
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
}
