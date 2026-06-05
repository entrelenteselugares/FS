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
