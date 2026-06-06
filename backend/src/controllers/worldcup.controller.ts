import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { WorldCupGamificationService } from "../services/worldcup_gamification.service";
import { sportsApiService } from "../services/sports_api.service";
import { supabaseAdmin as supabase } from "../lib/supabase";

const gamificationService = new WorldCupGamificationService(prisma);

/**
 * Retorna os jogos (matches) ativos
 */
export async function getMatches(req: Request, res: Response) {
  try {
    const matches = await prisma.worldCupMatch.findMany({
      where: { active: true },
      orderBy: { matchDate: "asc" }
    });
    return res.json({ matches });
  } catch (error) {
    console.error("Error fetching world cup matches:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Retorna (ou cria) a folha do álbum para um jogo específico
 */
export async function getMatchFolha(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    
    const matchId = req.params.matchId as string;

    let folha = await prisma.worldCupFolha.findUnique({
      where: { userId_matchId: { userId: user.userId, matchId } },
      include: { slots: true }
    }) as any;

    if (!folha) {
      // Create new folha with empty slots
      folha = await prisma.worldCupFolha.create({
        data: {
          userId: user.userId,
          matchId,
          slots: {
            create: Array.from({ length: 12 }).map((_, i) => ({
              slotIndex: i,
              missionType: i === 5 ? "COMIDA" : (i === 8 ? "ESCALACAO" : (i === 2 ? "SELFIE" : "LIVRE"))
            }))
          }
        },
        include: { slots: true }
      });
    }

    return res.json({ folha });
  } catch (error) {
    console.error("Error fetching match folha:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Faz o upload/preenchimento de um slot específico e roda a gamificação
 */
export async function fillSlot(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const matchId = req.params.matchId as string;
    const { slotIndex, imageUrl, metadata } = req.body;

    const folha = await prisma.worldCupFolha.findUnique({
      where: { userId_matchId: { userId: user.userId, matchId } },
      include: { slots: true }
    }) as any;

    if (!folha) return res.status(404).json({ error: "Folha not found" });

    const slot = folha.slots.find((s: any) => s.slotIndex === slotIndex);
    if (!slot) return res.status(404).json({ error: "Slot not found" });

    // Update the slot
    const updatedSlot = await prisma.worldCupSlot.update({
      where: { id: slot.id },
      data: {
        imageUrl,
        metadata: metadata || {}
      }
    });

    // Run Gamification Engine
    const badgesAwarded = await gamificationService.processBadges(user.userId, matchId);

    return res.json({ slot: updatedSlot, badgesAwarded });
  } catch (error) {
    console.error("Error filling slot:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Retorna todos os badges/conquistas do usuário
 */
export async function getBadges(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const badges = await prisma.worldCupBadge.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" }
    });

    return res.json({ badges });
  } catch (error) {
    console.error("Error fetching badges:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Retorna os placares ao vivo da API de esportes
 */
export async function getLiveScoreboard(req: Request, res: Response) {
  try {
    const liveMatches = await sportsApiService.getLiveMatches();
    return res.json({ live: liveMatches });
  } catch (error) {
    console.error("Error fetching live scoreboard:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Retorna o chaveamento oficial da Copa a partir da API de esportes
 */
export async function getTournamentBracket(req: Request, res: Response) {
  try {
    const bracket = await sportsApiService.getTournamentBracket();
    return res.json({ bracket });
  } catch (error) {
    console.error("Error fetching tournament bracket:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Retorna o ranking / leaderboard dos torcedores
 */
export async function getLeaderboard(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        profileImageUrl: true,
        worldCupFolhas: {
          include: {
            slots: true
          }
        },
        worldCupBadges: true
      }
    });

    const leaderboard = users.map(u => {
      let score = 0;
      let filledSlotsCount = 0;
      let totalLikesReceived = 0;
      let totalCommentsReceived = 0;

      u.worldCupFolhas.forEach(folha => {
        folha.slots.forEach(slot => {
          if (slot.imageUrl) {
            filledSlotsCount++;
            score += 50; // +50 por upload

            const meta = (slot.metadata && typeof slot.metadata === 'object') ? (slot.metadata as any) : {};
            const likes = Array.isArray(meta.likes) ? meta.likes : [];
            const comments = Array.isArray(meta.comments) ? meta.comments : [];

            totalLikesReceived += likes.length;
            score += likes.length * 10; // +10 por curtida

            totalCommentsReceived += comments.length;
            score += Math.min(comments.length, 5) * 20; // +20 por comentário (capado em 5)
          }
        });
      });

      const badgesCount = u.worldCupBadges.length;
      score += badgesCount * 100; // +100 por badge

      return {
        userId: u.id,
        nome: u.nome,
        profileImageUrl: u.profileImageUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(u.nome)}`,
        score,
        filledSlotsCount,
        badgesCount,
        totalLikesReceived,
        totalCommentsReceived
      };
    });

    // Ordena por score decrescente
    leaderboard.sort((a, b) => b.score - a.score);

    return res.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Dá like/unlike em um slot
 */
export async function toggleLikeSlot(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const matchId = req.params.matchId as string;
    const slotIndex = req.params.slotIndex as string;
    const index = parseInt(slotIndex, 10);

    const folha = await (prisma.worldCupFolha as any).findFirst({
      where: { matchId, slots: { some: { slotIndex: index } } },
      include: { slots: true }
    });

    if (!folha) return res.status(404).json({ error: "Folha not found" });

    const slot = folha.slots.find((s: any) => s.slotIndex === index);
    if (!slot) return res.status(404).json({ error: "Slot not found" });

    const meta = (slot.metadata && typeof slot.metadata === 'object') ? (slot.metadata as any) : {};
    let likes: string[] = Array.isArray(meta.likes) ? meta.likes : [];

    const userLikedIndex = likes.indexOf(user.userId);
    if (userLikedIndex > -1) {
      likes.splice(userLikedIndex, 1);
    } else {
      likes.push(user.userId);
    }

    const updatedSlot = await prisma.worldCupSlot.update({
      where: { id: slot.id },
      data: {
        metadata: {
          ...meta,
          likes
        }
      }
    });

    return res.json({ success: true, slot: updatedSlot });
  } catch (error) {
    console.error("Error toggling like on slot:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Adiciona um comentário em um slot
 */
export async function addCommentToSlot(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const matchId = req.params.matchId as string;
    const slotIndex = req.params.slotIndex as string;
    const { commentText } = req.body;
    if (!commentText || !commentText.trim()) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const index = parseInt(slotIndex, 10);

    const folha = await (prisma.worldCupFolha as any).findFirst({
      where: { matchId, slots: { some: { slotIndex: index } } },
      include: { slots: true }
    });

    if (!folha) return res.status(404).json({ error: "Folha not found" });

    const slot = folha.slots.find((s: any) => s.slotIndex === index);
    if (!slot) return res.status(404).json({ error: "Slot not found" });

    const meta = (slot.metadata && typeof slot.metadata === 'object') ? (slot.metadata as any) : {};
    const comments = Array.isArray(meta.comments) ? meta.comments : [];

    const newComment = {
      id: Math.random().toString(36).substring(2, 9),
      userId: user.userId,
      userName: user.nome || "Torcedor",
      commentText: commentText.trim(),
      createdAt: new Date().toISOString()
    };

    comments.push(newComment);

    const updatedSlot = await prisma.worldCupSlot.update({
      where: { id: slot.id },
      data: {
        metadata: {
          ...meta,
          comments
        }
      }
    });

    return res.json({ success: true, slot: updatedSlot, newComment });
  } catch (error) {
    console.error("Error adding comment to slot:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
