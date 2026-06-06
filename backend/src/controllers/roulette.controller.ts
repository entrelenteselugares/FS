import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function getRouletteStatus(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Check if user already spun
    const existingSpin = await prisma.worldCupRouletteSpin.findUnique({
      where: { userId: user.userId }
    });

    // Get all prizes with remaining quantity > 0
    const prizes = await prisma.worldCupPrize.findMany({
      where: { remainingQuantity: { gt: 0 } },
      orderBy: { weight: 'desc' }
    });

    return res.json({
      hasSpun: !!existingSpin,
      prizes: prizes.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        imageUrl: p.imageUrl,
        weight: p.weight
      }))
    });
  } catch (error) {
    console.error("Error getting roulette status:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function spinRoulette(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // 1. Double check if user already spun to prevent race conditions
    const existingSpin = await prisma.worldCupRouletteSpin.findUnique({
      where: { userId: user.userId }
    });

    if (existingSpin) {
      return res.status(400).json({ error: "Usuário já girou a roleta nesta Copa." });
    }

    // 2. Fetch available prizes (needs transaction to prevent overselling)
    const spinResult = await prisma.$transaction(async (tx) => {
      const prizes = await tx.worldCupPrize.findMany({
        where: { remainingQuantity: { gt: 0 } }
      });

      if (prizes.length === 0) {
        throw new Error("No prizes available");
      }

      // 3. Weighted Random Selection
      const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
      let randomValue = Math.random() * totalWeight;
      
      let selectedPrize = prizes[0];
      for (const prize of prizes) {
        randomValue -= prize.weight;
        if (randomValue <= 0) {
          selectedPrize = prize;
          break;
        }
      }

      // 4. Update prize quantity
      await tx.worldCupPrize.update({
        where: { id: selectedPrize.id },
        data: { remainingQuantity: { decrement: 1 } }
      });

      // 5. Record the spin
      const spin = await tx.worldCupRouletteSpin.create({
        data: {
          userId: user.userId,
          prizeId: selectedPrize.id
        }
      });

      // 6. If it's a digital credit prize, award it automatically
      if (selectedPrize.type === "DIGITAL_CREDITS" && selectedPrize.rewardAmount) {
        await tx.userPoints.upsert({
          where: { userId: user.userId },
          create: {
            userId: user.userId,
            total: selectedPrize.rewardAmount,
            redeemed: 0
          },
          update: {
            total: { increment: selectedPrize.rewardAmount }
          }
        });

        await tx.gamificationLedger.create({
          data: {
            userId: user.userId,
            type: "ROULETTE_SPIN",
            points: 0,
            amount: selectedPrize.rewardAmount,
            description: `Ganhou ${selectedPrize.rewardAmount} créditos na Roleta da Sorte`
          }
        });
      }

      return selectedPrize;
    });

    return res.json({ prize: spinResult });
  } catch (error: any) {
    console.error("Error spinning roulette:", error);
    if (error.message === "No prizes available") {
      return res.status(400).json({ error: "Nenhum prêmio disponível no momento." });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
