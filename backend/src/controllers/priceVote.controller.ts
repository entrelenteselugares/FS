import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../lib/auth";

export class PriceVoteController {
  /**
   * POST /api/events/:id/suggest-price
   * Envia uma sugestão de preço (Contratante ou Profissional)
   */
  static async suggestPrice(req: AuthRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { price } = req.body;
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      res.status(401).json({ error: "Não autenticado." });
      return;
    }

    if (price === undefined || isNaN(Number(price)) || Number(price) <= 0) {
      res.status(400).json({ error: "Preço sugerido inválido." });
      return;
    }

    try {
      const event = await prisma.event.findUnique({ where: { id } });
      if (!event) {
        res.status(404).json({ error: "Evento não encontrado." });
        return;
      }

      // Verifica permissões
      const isOwner = event.clientEmail === req.user?.email || event.ownerId === userId;
      const isPro = userId === event.captacaoId || userId === event.edicaoId || role === "ADMIN";

      if (!isOwner && !isPro) {
        res.status(403).json({ error: "Acesso negado para sugerir preço." });
        return;
      }

      const configs = (event.marketplaceConfigs as any) || {};
      const suggestions = configs.priceSuggestions || {};

      if (isOwner) {
        suggestions.owner = Number(price);
      } else {
        suggestions.pro = Number(price);
      }

      // Calcula a média do sistema (system) se ambos sugeriram
      if (suggestions.owner !== undefined && suggestions.pro !== undefined) {
        suggestions.system = +( (suggestions.owner + suggestions.pro) / 2 ).toFixed(2);
      } else {
        suggestions.system = Number(price);
      }

      const updated = await prisma.event.update({
        where: { id },
        data: {
          marketplaceConfigs: {
            ...configs,
            priceSuggestions: suggestions,
          },
        },
      });

      res.json({ success: true, event: updated });
    } catch (err: any) {
      console.error("[PriceVoteController.suggestPrice] Error:", err);
      res.status(500).json({ error: err.message || "Erro interno do servidor." });
    }
  }

  /**
   * POST /api/events/:id/vote-price
   * Vota em uma das opções sugeridas (OWNER, PRO ou SYSTEM)
   */
  static async votePrice(req: AuthRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { vote } = req.body; // "OWNER" | "PRO" | "SYSTEM"
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      res.status(401).json({ error: "Não autenticado." });
      return;
    }

    if (!["OWNER", "PRO", "SYSTEM"].includes(vote)) {
      res.status(400).json({ error: "Voto inválido. Escolha OWNER, PRO ou SYSTEM." });
      return;
    }

    try {
      const event = await prisma.event.findUnique({ where: { id } });
      if (!event) {
        res.status(404).json({ error: "Evento não encontrado." });
        return;
      }

      const isOwner = event.clientEmail === req.user?.email || event.ownerId === userId;
      const isPro = userId === event.captacaoId || userId === event.edicaoId || role === "ADMIN";

      if (!isOwner && !isPro) {
        res.status(403).json({ error: "Acesso negado para votar." });
        return;
      }

      const configs = (event.marketplaceConfigs as any) || {};
      const votes = configs.priceVotes || {};
      
      // Salva o voto do usuário atual
      votes[userId] = vote;

      // Realiza a apuração
      const suggestions = configs.priceSuggestions || {};
      const voteEntries = Object.entries(votes);
      const counts: Record<string, number> = { OWNER: 0, PRO: 0, SYSTEM: 0 };
      
      for (const [_, v] of voteEntries) {
        if (typeof v === "string" && counts[v] !== undefined) {
          counts[v]++;
        }
      }

      let winner: string = "SYSTEM";
      const maxVotes = Math.max(counts.OWNER, counts.PRO, counts.SYSTEM);

      // Em caso de empate absoluto, o SYSTEM (média) é o vencedor
      const tiedOptions = Object.keys(counts).filter(k => counts[k] === maxVotes);
      if (tiedOptions.length > 1) {
        winner = "SYSTEM";
      } else {
        winner = tiedOptions[0];
      }

      // Pega o valor correspondente ao vencedor
      let finalPrice = suggestions.system || 15;
      if (winner === "OWNER" && suggestions.owner !== undefined) {
        finalPrice = suggestions.owner;
      } else if (winner === "PRO" && suggestions.pro !== undefined) {
        finalPrice = suggestions.pro;
      } else if (suggestions.system !== undefined) {
        finalPrice = suggestions.system;
      }

      const updated = await prisma.event.update({
        where: { id },
        data: {
          pricePerPhoto: finalPrice,
          marketplaceConfigs: {
            ...configs,
            priceVotes: votes,
            priceWinner: winner,
          },
        },
      });

      res.json({ success: true, event: updated, votes, winner, finalPrice });
    } catch (err: any) {
      console.error("[PriceVoteController.votePrice] Error:", err);
      res.status(500).json({ error: err.message || "Erro interno do servidor." });
    }
  }

  /**
   * GET /api/events/:id/voting-status
   * Retorna os detalhes de votação, convidados e tabela de faturamento estimado
   */
  static async getVotingStatus(req: AuthRequest, res: Response): Promise<void> {
    const id = req.params.id as string;

    try {
      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          captacao: { select: { id: true, nome: true } },
          edicao: { select: { id: true, nome: true } },
        }
      });
      if (!event) {
        res.status(404).json({ error: "Evento não encontrado." });
        return;
      }

      // Extrai quantidade de convidados da descrição do evento
      let guests = 100; // Fallback
      if (event.description) {
        const match = event.description.match(/Convidados:\s*(\d+)/i);
        if (match && match[1]) {
          guests = parseInt(match[1], 10);
        }
      }

      const configs = (event.marketplaceConfigs as any) || {};
      const suggestions = configs.priceSuggestions || {};
      const votes = configs.priceVotes || {};
      const winner = configs.priceWinner || null;

      // Calcula as taxas de projeção (10%, 20%, 30% de conversão de convidados)
      const conversions = [0.10, 0.20, 0.30];
      const projections = conversions.map(pct => {
        const buyers = Math.round(guests * pct);
        return {
          pct: Math.round(pct * 100),
          buyers,
          revenueOwner: suggestions.owner ? +(buyers * suggestions.owner).toFixed(2) : 0,
          revenuePro: suggestions.pro ? +(buyers * suggestions.pro).toFixed(2) : 0,
          revenueSystem: suggestions.system ? +(buyers * suggestions.system).toFixed(2) : 0,
        };
      });

      res.json({
        success: true,
        guests,
        pricePerPhoto: event.pricePerPhoto,
        suggestions,
        votes,
        winner,
        projections,
        eventStatus: {
          captacao: (event as any).captacao,
          edicao: (event as any).edicao,
          clientEmail: event.clientEmail,
          clientName: event.clientName
        }
      });
    } catch (err: any) {
      console.error("[PriceVoteController.getVotingStatus] Error:", err);
      res.status(500).json({ error: err.message || "Erro interno do servidor." });
    }
  }
}
