import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../lib/auth";
import { logger } from "../lib/logger";


// ── CURTIDAS ──────────────────────────────────────────

// POST /api/events/:slug/photos/like
export async function likePhoto(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }
  
  const userId = user.userId;
  const { slug } = req.params;
  const { photoUrl } = req.body;

  if (!photoUrl) {
    res.status(400).json({ error: "photoUrl obrigatório." });
    return;
  }

  try {
    const event = await prisma.event.findUnique({ where: { slug: String(slug) } });
    if (!event) { res.status(404).json({ error: "Evento não encontrado." }); return; }

    // Titular não pode curtir o próprio álbum
    // No schema v4, o titular de um pedido de um evento é quem ganha pontos, 
    // mas o "titular" do evento em si pode ser o clienteId do pedido que foi público.
    // Vamos buscar o pedido do titular para validar.
    const titularOrder = await prisma.order.findFirst({
      where: { 
        eventId: event.id,
        accessType: "PUBLIC",
      }
    });

    if (titularOrder?.clienteId === userId) {
      res.status(403).json({ error: "Você não pode curtir seu próprio álbum." });
      return;
    }

    // Verifica se o evento tem acesso público
    const haPublicOrder = await prisma.order.findFirst({
      where: {
        eventId: event.id,
        accessType: "PUBLIC",
        deletedAt: null,
        accessExpiresAt: { gte: new Date() },
      },
    });
    
    if (!haPublicOrder) {
      res.status(403).json({ error: "Este álbum não está disponível para curtidas." });
      return;
    }

    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // Expiração em 90 dias

    // Cria a curtida (unique constraint evita duplicata)
    try {
      await prisma.photoLike.create({
        data: { userId, eventId: event.id, photoUrl, expiresAt },
      });

      // Adiciona ponto para o titular do pedido (quem comprou as fotos)
      if (haPublicOrder.clienteId) {
        await prisma.userPoints.upsert({
          where: { userId: haPublicOrder.clienteId },
          create: { userId: haPublicOrder.clienteId, total: 1 },
        });
      }

      await logger.info(userId, "PHOTO_LIKED", { eventId: event.id, photoUrl });
    } catch (err: any) {
      if (err.code === "P2002") {
        // Já curtiu — remove a curtida (toggle)
        await prisma.photoLike.deleteMany({
          where: {
            userId,
            eventId: event.id,
            photoUrl,
          },
        });

        if (haPublicOrder.clienteId) {
          await prisma.userPoints.update({
            where: { userId: haPublicOrder.clienteId },
            data: { total: { decrement: 1 } },
          });
        }

        await logger.info(userId, "PHOTO_UNLIKED", { eventId: event.id, photoUrl });

        const totalLikes = await prisma.photoLike.count({
          where: { eventId: event.id, photoUrl },
        });

        res.json({ liked: false, totalLikes });
        return;
      }
      throw err;
    }

    // Conta total de curtidas desta foto
    const totalLikes = await prisma.photoLike.count({
      where: { eventId: event.id, photoUrl },
    });

    res.json({ liked: true, totalLikes });

  } catch (err: any) {
    console.error("likePhoto:", err);
    res.status(500).json({ error: "Erro ao registrar curtida." });
  }
}

// GET /api/events/:slug/likes
export async function getEventLikes(req: AuthRequest, res: Response): Promise<void> {
  const { slug } = req.params;
  const user = req.user;
  const userId = user?.userId;

  try {
    const event = await prisma.event.findUnique({ where: { slug: String(slug) } });
    if (!event) { res.status(404).json({ error: "Evento não encontrado." }); return; }

    // Curtidas agrupadas por foto
    const likes = await prisma.photoLike.groupBy({
      by: ["photoUrl"],
      where: { eventId: event.id, expiresAt: { gte: new Date() } },
      _count: { photoUrl: true },
    });

    // Fotos que o usuário atual curtiu
    let myLikes: string[] = [];
    if (userId) {
      const userLikes = await prisma.photoLike.findMany({
        where: { userId, eventId: event.id },
        select: { photoUrl: true },
      });
      myLikes = userLikes.map((l) => l.photoUrl);
    }

    res.json({
      likes: likes.map((l) => ({
        photoUrl: l.photoUrl,
        count: l._count.photoUrl,
        likedByMe: myLikes.includes(l.photoUrl),
      })),
      totalLikes: likes.reduce((acc, l) => acc + l._count.photoUrl, 0),
    });

  } catch (err) {
    console.error("getEventLikes:", err);
    res.status(500).json({ error: "Erro ao buscar curtidas." });
  }
}

// ── PONTOS ────────────────────────────────────────────

// GET /api/me/points
export async function getMyPoints(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }
  const userId = user.userId;

  try {
    const points = await prisma.userPoints.findUnique({ where: { userId } });
    const available = (points?.total ?? 0) - (points?.redeemed ?? 0);

    // Calcula pacotes disponíveis
    const packages = [
      { name: "1 foto impressa", points: 12, quantity: 1, key: "12" },
      { name: "2 fotos impressas", points: 24, quantity: 2, key: "24" },
      { name: "3 fotos impressas", points: 36, quantity: 3, key: "36" },
    ].map((pkg) => ({
      ...pkg,
      available: available >= pkg.points,
      pointsNeeded: Math.max(0, pkg.points - available),
    }));

    res.json({
      total: points?.total ?? 0,
      redeemed: points?.redeemed ?? 0,
      available,
      packages,
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar pontos." });
  }
}

// POST /api/me/redeem-print
export async function redeemPrint(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }
  const userId = user.userId;
  const { packageType, selectedPhotos, deliveryType, address } = req.body;

  const packageCosts: Record<string, { points: number; quantity: number }> = {
    "12": { points: 12, quantity: 1 },
    "24": { points: 24, quantity: 2 },
    "36": { points: 36, quantity: 3 },
  };

  const pkg = packageCosts[packageType];
  if (!pkg) {
    res.status(400).json({ error: "Pacote inválido." });
    return;
  }

  if (!selectedPhotos || selectedPhotos.length < pkg.quantity) {
    res.status(400).json({ error: `Selecione ${pkg.quantity} foto(s) para imprimir.` });
    return;
  }

  try {
    const points = await prisma.userPoints.findUnique({ where: { userId } });
    const available = (points?.total ?? 0) - (points?.redeemed ?? 0);

    if (available < pkg.points) {
      res.status(400).json({
        error: `Pontos insuficientes. Você tem ${available} pontos e precisa de ${pkg.points}.`,
      });
      return;
    }

    // Busca fornecedor ativo
    const supplier = await prisma.printSupplier.findFirst({
      where: { active: true },
    });

    // Calcula custo estimado
    const unitCost = Number(supplier?.costPer10x15 ?? 0);
    const boxCost = Number(supplier?.boxCost ?? 0);
    const labelCost = Number(supplier?.labelCost ?? 0);
    const shippingCost = deliveryType === "MAIL"
      ? Number(supplier?.uberCost ?? 40)
      : 0;
    const totalCost = (unitCost * pkg.quantity) + boxCost + labelCost + shippingCost;

    // Cria o resgate em transaction
    const redemption = await prisma.$transaction(async (tx) => {
      // Re-validação atômica de saldo dentro da transação
      const pointsTx = await tx.userPoints.findUnique({ where: { userId } });
      const availableTx = (pointsTx?.total ?? 0) - (pointsTx?.redeemed ?? 0);

      if (availableTx < pkg.points) {
        throw new Error(`Saldo insuficiente verificado durante a transação (${availableTx} pts)`);
      }

      const r = await tx.printRedemption.create({
        data: {
          userId,
          pointsUsed: pkg.points,
          quantity: pkg.quantity,
          packageType,
          selectedPhotos: selectedPhotos.slice(0, pkg.quantity),
          deliveryType,
          addressJson: address ? JSON.stringify(address) : null,
          supplierId: supplier?.id,
          unitCost,
          shippingCost,
          totalCost,
        },
      });

      await tx.userPoints.update({
        where: { userId },
        data: { redeemed: { increment: pkg.points } },
      });

      // Log de Auditoria
      await logger.info(userId, "GIFT_REDEEMED", { 
        packageType, 
        quantity: pkg.quantity, 
        pointsUsed: pkg.points 
      });

      return r;
    });

    res.status(201).json({
      redemptionId: redemption.id,
      status: redemption.status,
      quantity: redemption.quantity,
      totalCost,
      mensagem: `Resgate criado! ${pkg.quantity} foto(s) serão impressas e enviadas.`,
    });

  } catch (err) {
    console.error("redeemPrint:", err);
    res.status(500).json({ error: "Erro ao criar resgate." });
  }
}
