import prisma from "../lib/prisma";
import { logger } from "../lib/logger";
import { Prisma } from "@prisma/client";

/**
 * GamificationService
 * Centraliza a lógica de recompensas, cashback e SLA da Fase 10.
 */
export class GamificationService {
  /**
   * Processa recompensas para um pedido aprovado (Cashback).
   * Lógica: 5% do valor do pedido retorna como rewardCredits para o cliente.
   */
  static async processOrderRewards(orderId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { cliente: true }
      });

      if (!order || !order.clienteId || !order.hasPaid) return;

      // 1. Cálculo de Cashback (5%)
      const cashbackPct = 0.05;
      const rewardAmount = new Prisma.Decimal(Number(order.valor) * cashbackPct).toDecimalPlaces(2);

      if (rewardAmount.lte(0)) return;

      await prisma.$transaction(async (tx) => {
        // 2. Registro no Ledger Imutável
        await tx.gamificationLedger.create({
          data: {
            userId: order.clienteId!,
            type: "EARN_CASHBACK",
            amount: rewardAmount,
            points: Math.floor(rewardAmount.toNumber() * 10), // 1 real = 10 pontos (estético)
            description: `Cashback de 5% sobre o pedido ${orderId.slice(-6).toUpperCase()}`,
            orderId: order.id
          }
        });

        // 3. Atualização do saldo de RewardCredits do Usuário
        await tx.user.update({
          where: { id: order.clienteId! },
          data: {
            rewardCredits: { increment: rewardAmount }
          }
        });
      });

      // 4. Verificação de Franquia (Onda 4)
      const event = await prisma.event.findUnique({
        where: { id: order.eventId },
        select: { franchiseeId: true }
      });

      if (event?.franchiseeId) {
        await GamificationService.updateFranchiseTier(event.franchiseeId);
      }

      console.log(`[Gamification] Cashback de ${rewardAmount} creditado para o usuário ${order.clienteId}`);
    } catch (error) {
      console.error("[GamificationService.processOrderRewards Error]:", error);
    }
  }

  /**
   * Processa pontos de agilidade para o fotógrafo baseado no SLA de entrega.
   * Lógica: Se entregue em menos de 24h, ganha 50 pontos de agilidade.
   */
  static async processSLA(eventId: string) {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { captacao: { include: { profissional: true } } }
      });

      if (!event || !event.eventEndTime || !event.galleryUploadTime || !event.captacaoId) return;

      const diffMs = event.galleryUploadTime.getTime() - event.eventEndTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours <= 24) {
        const points = 50;
        
        await prisma.$transaction(async (tx) => {
          // Registro no Ledger
          await tx.gamificationLedger.create({
            data: {
              userId: event.captacaoId!,
              type: "SLA_BONUS",
              points,
              description: `Bônus de agilidade: Galeria entregue em ${diffHours.toFixed(1)}h (SLA < 24h)`
            }
          });

          // Atualiza Agility Points do Profissional
          await tx.profissional.update({
            where: { userId: event.captacaoId! },
            data: {
              agilityPoints: { increment: points },
              totalMissions: { increment: 1 },
              avgDeliveryHours: {
                // Média ponderada simples
                set: event.captacao?.profissional?.totalMissions 
                  ? (event.captacao.profissional.avgDeliveryHours + diffHours) / 2
                  : diffHours
              }
            }
          });
        });
        
        console.log(`[Gamification] Bônus de SLA de ${points} pontos para o profissional ${event.captacaoId}`);
      }
    } catch (error) {
      console.error("[GamificationService.processSLA Error]:", error);
    }
  }

  /**
   * Atualiza o nível (Tier) da franquia baseado no volume de vendas.
   */
  static async updateFranchiseTier(franchiseId: string) {
    try {
      const franchise = await prisma.franchiseProfile.findUnique({
        where: { id: franchiseId },
        include: { user: true }
      });

      if (!franchise) return;

      const salesCount = await prisma.order.count({
        where: {
          eventId: { in: await prisma.event.findMany({ where: { franchiseeId: franchiseId }, select: { id: true } }).then(events => events.map(e => e.id)) },
          status: "APROVADO"
        }
      });

      let newTier: "BRONZE" | "SILVER" | "GOLD" | "DIAMOND" = "BRONZE";
      if (salesCount >= 100) newTier = "DIAMOND";
      else if (salesCount >= 50) newTier = "GOLD";
      else if (salesCount >= 10) newTier = "SILVER";

      if (franchise.tier !== newTier) {
        await prisma.franchiseProfile.update({
          where: { id: franchiseId },
          data: { tier: newTier }
        });

        // Registro no Ledger
        await prisma.gamificationLedger.create({
          data: {
            userId: franchise.userId,
            type: "TIER_UPGRADE",
            description: `Parabéns! Sua franquia atingiu o nível ${newTier} (${salesCount} vendas).`
          }
        });

        console.log(`[Gamification] Franquia ${franchiseId} subiu para o nível ${newTier}`);
      }
    } catch (error) {
      console.error("[GamificationService.updateFranchiseTier Error]:", error);
    }
  }
}
