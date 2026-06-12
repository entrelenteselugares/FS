import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { WorldCupGamificationService } from "../services/worldcup_gamification.service";
import { sportsApiService, setManualScore } from "../services/sports_api.service";
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
/**
 * Retorna os placares reais (salvos manualmente ou da API) para o Bolão
 */
export async function getScores(req: Request, res: Response) {
  try {
    const scores = await sportsApiService.getAllManualScores();
    return res.json({ scores });
  } catch (error) {
    console.error("Error fetching all scores:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

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
        worldCupBadges: true,
        worldCupBets: {
          where: { settled: true },
          select: { pointsAwarded: true }
        }
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

      const betPoints = u.worldCupBets.reduce((acc, bet) => acc + bet.pointsAwarded, 0);
      score += betPoints; // Pontos do bolão

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

export const MISSIONS = [
  { quiz: "Em que ano o Brasil ganhou o Penta?", options: ["1994", "1998", "2002", "2006"], answerIndex: 2, missionTitle: "A foto clássica", missionDesc: "Selfie com a camisa da seleção" },
  { quiz: "Quem é o maior artilheiro das Copas?", options: ["Pelé", "Ronaldo", "Miroslav Klose", "Messi"], answerIndex: 2, missionTitle: "A Torcida", missionDesc: "Foto com pelo menos 3 amigos" },
  { quiz: "Qual país sediou a Copa de 2010?", options: ["Alemanha", "Brasil", "África do Sul", "Catar"], answerIndex: 2, missionTitle: "O Estádio Caseiro", missionDesc: "Foto da TV/Telão mostrando o jogo" },
  { quiz: "Quem fez o gol do título do Brasil em 1994?", options: ["Romário", "Bebeto", "Branco", "Baggio perdeu o pênalti"], answerIndex: 3, missionTitle: "A Resenha", missionDesc: "Foto dos petiscos/comida do jogo" },
  { quiz: "Qual o Mascote da Copa de 2014?", options: ["Fuleco", "Zakumi", "Zabivaka", "La'eeb"], answerIndex: 0, missionTitle: "O Amuleto", missionDesc: "Foto com um objeto da sorte ou bandeira" },
  { quiz: "Qual seleção tem 4 títulos mundiais?", options: ["Brasil", "Alemanha", "França", "Uruguai"], answerIndex: 1, missionTitle: "Momento de Tensão", missionDesc: "Foto roendo a unha ou de mãos dadas" },
  { quiz: "Quem venceu a primeira Copa em 1930?", options: ["Argentina", "Uruguai", "Brasil", "Itália"], answerIndex: 1, missionTitle: "O Grito de Gol", missionDesc: "Foto comemorando (ou imitando comemoração)" },
  { quiz: "Qual jogador era conhecido como Fenômeno?", options: ["Romário", "Ronaldinho Gaúcho", "Ronaldo", "Kaká"], answerIndex: 2, missionTitle: "O Rei do Camarote", missionDesc: "Foto com uma bebida na mão" },
  { quiz: "Qual país mais vezes foi vice-campeão?", options: ["Holanda", "Argentina", "Alemanha", "Itália"], answerIndex: 2, missionTitle: "Vestido a rigor", missionDesc: "Foto mostrando os pés (chinelo, chuteira)" },
  { quiz: "Quem é o atual campeão do mundo (2022)?", options: ["França", "Croácia", "Argentina", "Brasil"], answerIndex: 2, missionTitle: "Invasão de Campo", missionDesc: "Foto do pet (cachorro/gato) assistindo o jogo" },
  { quiz: "Quem fez a narração do 'Haja coração'?", options: ["Galvão Bueno", "Cleber Machado", "Luis Roberto", "Silvio Luiz"], answerIndex: 0, missionTitle: "Festa no Sofá", missionDesc: "Foto de todos sentados no sofá" },
  { quiz: "Quantas copas o Pelé ganhou?", options: ["1", "2", "3", "4"], answerIndex: 2, missionTitle: "O Fim de Jogo", missionDesc: "Foto do placar final ou expressando a emoção" }
];

export async function getMissionsData(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    
    const activeMatch = await prisma.worldCupMatch.findFirst({
      where: { active: true },
      orderBy: { matchDate: "asc" }
    });
    
    if (!activeMatch) {
      return res.json({ missions: MISSIONS, progress: [] });
    }

    let folha: any = await prisma.worldCupFolha.findUnique({
      where: { userId_matchId: { userId: user.userId, matchId: activeMatch.id } },
      include: { slots: true }
    });

    if (!folha) {
       folha = await prisma.worldCupFolha.create({
        data: {
          userId: user.userId,
          matchId: activeMatch.id,
          slots: {
            create: Array.from({ length: 12 }).map((_, i) => ({
              slotIndex: i,
              missionType: "MISSAO"
            }))
          }
        },
        include: { slots: true }
      });
    }

    // Ensure all 12 slots exist if somehow they were deleted
    if (folha.slots.length < 12) {
      const existingIndexes = folha.slots.map((s: any) => s.slotIndex);
      const missing = Array.from({ length: 12 }).map((_, i) => i).filter(i => !existingIndexes.includes(i));
      if (missing.length > 0) {
        await prisma.worldCupSlot.createMany({
          data: missing.map(i => ({
            folhaId: folha.id,
            slotIndex: i,
            missionType: "MISSAO"
          }))
        });
        folha = await prisma.worldCupFolha.findUnique({
          where: { userId_matchId: { userId: user.userId, matchId: activeMatch.id } },
          include: { slots: true }
        }) as any;
      }
    }

    return res.json({ missions: MISSIONS, folhaId: folha.id, progress: folha.slots });
  } catch (error) {
    console.error("Error fetching missions data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function submitQuizAnswer(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { slotId, answerIndex } = req.body;
    
    const slot = await prisma.worldCupSlot.findUnique({
      where: { id: slotId }
    });
    if (!slot) return res.status(404).json({ error: "Slot not found" });

    const mission = MISSIONS[slot.slotIndex];
    if (!mission) return res.status(400).json({ error: "Mission not found" });

    if (mission.answerIndex === answerIndex) {
      const updated = await prisma.worldCupSlot.update({
        where: { id: slotId },
        data: { quizPassed: true }
      });
      return res.json({ success: true, slot: updated });
    } else {
      return res.status(400).json({ error: "Incorrect answer" });
    }
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function uploadMissionPhoto(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { slotId, imageUrl } = req.body;

    const slot = await prisma.worldCupSlot.findUnique({ where: { id: slotId } });
    if (!slot) return res.status(404).json({ error: "Slot not found" });
    if (!slot.quizPassed) return res.status(400).json({ error: "Quiz not passed yet" });

    const updated = await prisma.worldCupSlot.update({
      where: { id: slotId },
      data: {
        imageUrl,
        status: "AWAITING_VALIDATION"
      }
    });

    return res.json({ success: true, slot: updated });
  } catch (error) {
    console.error("Error uploading mission photo:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getPendingCommunityValidations(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const pendingSlots = await prisma.worldCupSlot.findMany({
      where: {
        status: "AWAITING_VALIDATION",
        folha: {
          userId: { not: user.userId }
        },
        validations: {
          none: {
            userId: user.userId
          }
        }
      },
      include: {
        folha: {
          include: {
            user: {
              select: { nome: true, profileImageUrl: true }
            }
          }
        }
      },
      take: 10
    });

    const mapped = pendingSlots.map(s => ({
      id: s.id,
      imageUrl: s.imageUrl,
      slotIndex: s.slotIndex,
      missionTitle: MISSIONS[s.slotIndex]?.missionTitle,
      missionDesc: MISSIONS[s.slotIndex]?.missionDesc,
      userName: s.folha.user.nome,
      userAvatar: s.folha.user.profileImageUrl
    }));

    return res.json({ pending: mapped });
  } catch (error) {
    console.error("Error fetching pending validations:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function validateMissionPhoto(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const slotId = req.params.slotId as string;
    const { isApproved } = req.body;

    const slot: any = await prisma.worldCupSlot.findUnique({
      where: { id: slotId },
      include: { folha: true }
    });

    if (!slot || slot.status !== "AWAITING_VALIDATION") {
      return res.status(400).json({ error: "Slot not awaiting validation" });
    }

    await prisma.worldCupSlotValidation.create({
      data: {
        slotId,
        userId: user.userId,
        isApproved
      }
    });

    const validations = await prisma.worldCupSlotValidation.findMany({
      where: { slotId }
    });

    const upvotes = validations.filter(v => v.isApproved).length;
    const downvotes = validations.filter(v => !v.isApproved).length;

    let newStatus = slot.status;
    let badgesAwarded: any = null;

    if (upvotes - downvotes >= 2) {
      newStatus = "APPROVED";
      badgesAwarded = await gamificationService.processBadges(slot.folha.userId, slot.folha.matchId);
      
      await prisma.gamificationLedger.create({
        data: {
          userId: user.userId,
          type: "COMMUNITY_VALIDATION_REWARD",
          points: 10,
          description: "Ajudou a comunidade validando uma foto"
        }
      });
    } else if (downvotes - upvotes >= 2) {
      newStatus = "REJECTED";
    }

    if (newStatus !== slot.status) {
      await prisma.worldCupSlot.update({
        where: { id: slotId },
        data: { status: newStatus }
      });
    }

    return res.json({ success: true, newStatus, badgesAwarded });
  } catch (error) {
    console.error("Error validating mission photo:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getBets(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const bets = await prisma.worldCupBet.findMany({
      where: { userId: user.userId }
    });

    return res.json({ bets });
  } catch (error) {
    console.error("Error fetching bets:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function placeBet(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { fixtureId, homeScore, awayScore } = req.body;

    if (!fixtureId || typeof homeScore !== 'number' || typeof awayScore !== 'number') {
      return res.status(400).json({ error: "Invalid bet data" });
    }

    // Award 1 participation point + 2 credits on first bet
    const existing = await prisma.worldCupBet.findUnique({
      where: { userId_fixtureId: { userId: user.userId, fixtureId } }
    });

    const bet = await prisma.worldCupBet.upsert({
      where: { userId_fixtureId: { userId: user.userId, fixtureId } },
      update: { homeScore, awayScore },
      create: { userId: user.userId, fixtureId, homeScore, awayScore }
    });

    // Award participation credits only on first bet
    if (!existing) {
      await prisma.gamificationLedger.create({
        data: {
          userId: user.userId,
          type: "BET_PARTICIPATION",
          points: 1,
          description: `Palpite enviado para o jogo ${fixtureId}`
        }
      });
    }

    return res.json({ success: true, bet });
  } catch (error) {
    console.error("Error placing bet:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * POST /worldcup/bets/settle — Admin only
 * Apura as apostas de um jogo com o placar real e distribui pontos e créditos.
 */
export async function settleBets(req: Request, res: Response) {
  try {
    const { fixtureId, realHomeScore, realAwayScore } = req.body;

    if (!fixtureId || typeof realHomeScore !== 'number' || typeof realAwayScore !== 'number') {
      return res.status(400).json({ error: "Invalid settlement data" });
    }

    const bets = await prisma.worldCupBet.findMany({
      where: { fixtureId, settled: false }
    });

    const realResult = realHomeScore > realAwayScore ? 'H' : realHomeScore < realAwayScore ? 'A' : 'D';

    let settledCount = 0;
    for (const bet of bets) {
      const betResult = bet.homeScore > bet.awayScore ? 'H' : bet.homeScore < bet.awayScore ? 'A' : 'D';
      const isExact = bet.homeScore === realHomeScore && bet.awayScore === realAwayScore;
      const isResultCorrect = betResult === realResult;

      let points = 0;
      let credits = 0;

      if (isExact) {
        points = 10; credits = 20;
      } else if (isResultCorrect) {
        points = 3; credits = 6;
      }

      await prisma.worldCupBet.update({
        where: { id: bet.id },
        data: { settled: true, pointsAwarded: points, creditsAwarded: credits }
      });

      if (points > 0) {
        await prisma.gamificationLedger.create({
          data: {
            userId: bet.userId,
            type: isExact ? "BET_EXACT_SCORE" : "BET_CORRECT_RESULT",
            points,
            description: isExact
              ? `Placar exato em ${fixtureId}! (+${points} pts, +${credits} créditos)`
              : `Resultado correto em ${fixtureId} (+${points} pts, +${credits} créditos)`
          }
        });

        // Update UserPoints balance
        await prisma.userPoints.upsert({
          where: { userId: bet.userId },
          update: { total: { increment: credits } },
          create: { userId: bet.userId, total: credits, redeemed: 0 }
        });
      }

      settledCount++;
    }

    return res.json({ success: true, settled: settledCount, fixtureId, realHomeScore, realAwayScore });
  } catch (error) {
    console.error("Error settling bets:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * GET /worldcup/bets/summary — Returns the user's bet stats
 */
export async function getUserBetSummary(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const bets = await prisma.worldCupBet.findMany({ where: { userId: user.userId } });
    const settled = bets.filter(b => b.settled);
    const totalPoints = settled.reduce((sum: number, b) => sum + b.pointsAwarded, 0);
    const totalCredits = settled.reduce((sum: number, b) => sum + b.creditsAwarded, 0);
    const exactCount = settled.filter(b => b.pointsAwarded === 10).length;
    const correctCount = settled.filter(b => b.pointsAwarded === 3).length;

    const userPoints = await prisma.userPoints.findUnique({ where: { userId: user.userId } });

    return res.json({
      totalBets: bets.length,
      settledBets: settled.length,
      totalPoints,
      totalCredits,
      exactCount,
      correctCount,
      availableCredits: Number(userPoints?.total ?? 0) - Number(userPoints?.redeemed ?? 0)
    });
  } catch (error) {
    console.error("Error fetching bet summary:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * GET /worldcup/nostalgia
 * Retorna os posts do mural de nostalgia para um ano específico
 */
export async function getNostalgia(req: Request, res: Response) {
  try {
    const year = req.query.year ? Number(req.query.year) : 2022;
    void year; // used for future real data
    return res.json({ posts: [] });
  } catch (error) {
    console.error("Error fetching nostalgia posts:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * POST /worldcup/admin/score — Admin only
 * Sets the live score for a fixture in Redis so the banner reflects real results
 * Body: { fixtureId, home, away }
 */
export async function setLiveScore(req: Request, res: Response) {
  try {
    const { fixtureId, home, away } = req.body;
    if (!fixtureId || typeof home !== 'number' || typeof away !== 'number') {
      return res.status(400).json({ error: "fixtureId, home and away (numbers) are required" });
    }
    await setManualScore(fixtureId, home, away);
    console.log(`[WorldCup] Admin set score ${fixtureId}: ${home}x${away}`);
    return res.json({ success: true, fixtureId, home, away });
  } catch (error) {
    console.error("Error setting live score:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
