import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// ── Admin: CRUD de Concursos ───────────────────────────

export async function adminCreateContest(req: Request, res: Response): Promise<void> {
  const { title, description, startDate, endDate, prize1st, prize2nd, prize3rd, prize1stPts, prize2ndPts, prize3rdPts } = req.body;

  if (!title || !startDate || !endDate || !prize1st || !prize1stPts) {
    res.status(400).json({ error: "Título, datas e premiação do 1º lugar são obrigatórios." });
    return;
  }

  try {
    const contest = await prisma.contest.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        prize1st,
        prize2nd,
        prize3rd,
        prize1stPts: Number(prize1stPts),
        prize2ndPts: prize2ndPts ? Number(prize2ndPts) : null,
        prize3rdPts: prize3rdPts ? Number(prize3rdPts) : null,
        status: "DRAFT",
      },
    });
    res.status(201).json(contest);
  } catch (err) {
    console.error("adminCreateContest:", err);
    res.status(500).json({ error: "Erro ao criar concurso." });
  }
}

export async function adminListContests(req: Request, res: Response): Promise<void> {
  try {
    const contests = await prisma.contest.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(contests);
  } catch {
    res.status(500).json({ error: "Erro ao listar concursos." });
  }
}

export async function adminUpdateContest(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { status, title, description, endDate } = req.body;

  try {
    const updated = await prisma.contest.update({
      where: { id: String(id) },
      data: {
        ...(status && { status }),
        ...(title && { title }),
        ...(description && { description }),
        ...(endDate && { endDate: new Date(endDate) }),
      },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Erro ao atualizar concurso." });
  }
}

export async function adminDeleteContest(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    await prisma.contest.delete({
      where: { id: String(id) }
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("adminDeleteContest:", err);
    res.status(500).json({ error: "Erro ao excluir concurso." });
  }
}

// ── Rankings & Hall da Fama ────────────────────────────

// GET /api/public/contests/active
export async function getActiveContest(req: Request, res: Response): Promise<void> {
  try {
    const contest = await prisma.contest.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { endDate: "asc" },
    });
    
    if (!contest) {
      res.json(null);
      return;
    }

    // Calcula o ranking atual em tempo real
    const ranking = await getContestRankingInternal(contest.startDate, contest.endDate);

    res.json({
      contest,
      ranking,
    });
  } catch (err) {
    console.error("getActiveContest:", err);
    res.status(500).json({ error: "Erro ao buscar concurso ativo." });
  }
}

// GET /api/public/contests/hall-of-fame
export async function getHallOfFame(req: Request, res: Response): Promise<void> {
  try {
    const finishedContests = await prisma.contest.findMany({
      where: { status: "FINISHED" },
      orderBy: { endDate: "desc" },
      take: 5,
    });

    const results = await Promise.all(finishedContests.map(async (c) => {
      const ranking = await getContestRankingInternal(c.startDate, c.endDate, 3);
      return {
        contest: c,
        winners: ranking,
      };
    }));

    res.json(results);
  } catch {
    res.status(500).json({ error: "Erro ao buscar Hall da Fama." });
  }
}

/**
 * Lógica Interna: Calcula os eventos com mais curtidas em um período
 */
async function getContestRankingInternal(start: Date, end: Date, limit: number = 5) {
  // 1. Agrupar likes por eventId dentro do período
  const likesByEvent = await prisma.photoLike.groupBy({
    by: ["eventId"],
    where: {
      createdAt: { gte: start, lte: end },
    },
    _count: { photoUrl: true },
    orderBy: { _count: { photoUrl: "desc" } },
    take: limit,
  });

  // 2. Hidratar com dados dos eventos
  const ranking = await Promise.all(likesByEvent.map(async (item) => {
    const event = await prisma.event.findUnique({
      where: { id: item.eventId },
      select: {
        id: true,
        nomeNoivos: true,
        slug: true,
        coverPhotoUrl: true,
        cartorio: true,
      },
    });

    return {
      event,
      likes: item._count.photoUrl,
    };
  }));

  return ranking;
}
