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

  /**
   * Processa recompensas por fidelidade em assinaturas recorrentes.
   * Lógica: 100 pontos por cada faturamento mensal bem-sucedido.
   */
  static async processSubscriptionRewards(userId: string, subscriptionId: string) {
    try {
      const points = 100;
      
      await prisma.$transaction(async (tx) => {
        // 1. Registro no Ledger
        await tx.gamificationLedger.create({
          data: {
            userId,
            type: "SUBSCRIPTION_LOYALTY",
            points,
            description: `Bônus de fidelidade: Ciclo mensal da assinatura #${subscriptionId.slice(-6).toUpperCase()} processado.`
          }
        });

        // 2. Atualização dos pontos estéticos do usuário (Fase 10 compatibilidade)
        await tx.userPoints.upsert({
          where: { userId },
          create: { userId, total: points },
          update: { total: { increment: points } }
        });
      });

      console.log(`[Gamification] Bônus de fidelidade (${points} pts) creditado para usuário ${userId}`);
    } catch (error) {
      console.error("[GamificationService.processSubscriptionRewards Error]:", error);
    }
  }

  /**
   * Processa recompensas ao completar um ciclo mensal de cofre.
   */
  static async processCycleClosureRewards(userId: string, albumName: string) {
    try {
      const points = 250; // Bônus maior por completar o ciclo (materialização)
      
      await prisma.$transaction(async (tx) => {
        await tx.gamificationLedger.create({
          data: {
            userId,
            type: "CYCLE_COMPLETED",
            points,
            description: `Meta atingida! Ciclo do cofre "${albumName}" concluído e enviado para impressão.`
          }
        });

        await tx.userPoints.upsert({
          where: { userId },
          create: { userId, total: points },
          update: { total: { increment: points } }
        });
      });

      console.log(`[Gamification] Bônus de ciclo concluído (${points} pts) para usuário ${userId}`);
    } catch (error) {
      console.error("[GamificationService.processCycleClosureRewards Error]:", error);
    }
  }

  /**
   * Calcula dinamicamente as medalhas/badges do profissional.
   */
  static getProfessionalBadges(profile: any, isSubscriber: boolean) {
    if (!profile) return [];

    const user = profile.user || {};

    // 1. Completeness do Perfil
    const steps = [
      { done: !!user.profileImageUrl, weight: 20 },
      { done: !!user.nome, weight: 10 },
      { done: !!user.whatsapp, weight: 10 },
      { done: !!user.address && (user.address || "").split('|').filter(Boolean).length > 3, weight: 10 },
      { done: !!user.pixKey, weight: 10 },
      { done: (profile.experienceYears ?? 0) > 0, weight: 10 },
      { done: !!profile.firstJobUrl, weight: 10 },
      { done: (profile.services?.length ?? 0) > 0, weight: 10 },
      { done: (Array.isArray(profile.equipmentList) ? profile.equipmentList.length : 0) > 0, weight: 10 },
    ];
    const completeness = steps.reduce((acc, s) => acc + (s.done ? s.weight : 0), 0);

    // 2. Valor de Equipamentos
    let equipmentValue = 0;
    if (Array.isArray(profile.equipmentList)) {
      equipmentValue = profile.equipmentList.reduce((acc: number, curr: any) => acc + (Number(curr?.value) || 0), 0);
    }

    const badges = [];

    // Badge 1: Pioneiro
    const hasPioneiro = !!profile.isExperienceValidated;
    badges.push({
      id: "pioneiro",
      name: "Pioneiro",
      description: "Fotógrafo verificado na Foto Segundo",
      icon: "ShieldCheck",
      tier: "BRONZE",
      status: hasPioneiro ? "UNLOCKED" : "LOCKED",
      progress: {
        current: hasPioneiro ? 1 : 0,
        target: 1,
        percentage: hasPioneiro ? 100 : 0
      }
    });

    // Badge 2: Tech Master
    const hasTechMaster = equipmentValue >= 10000;
    badges.push({
      id: "tech_master",
      name: "Tech Master",
      description: "Inventário de equipamentos superior a R$ 10.000",
      icon: "Camera",
      tier: "SILVER",
      status: hasTechMaster ? "UNLOCKED" : "LOCKED",
      progress: {
        current: equipmentValue,
        target: 10000,
        percentage: Math.min(100, Math.floor((equipmentValue / 10000) * 100))
      }
    });

    // Badge 3: Mestre do Tempo
    const isMestreDoTempo = profile.avgDeliveryHours > 0 && profile.avgDeliveryHours <= 24 && profile.totalMissions >= 5;
    let tempoPercentage = 0;
    let tempoCurrent = 0;
    const tempoTarget = 5;

    if (profile.totalMissions < 5) {
      tempoCurrent = profile.totalMissions;
      tempoPercentage = Math.floor((profile.totalMissions / 5) * 80); // max 80% if not enough missions
    } else {
      tempoCurrent = 5;
      if (profile.avgDeliveryHours <= 24) {
        tempoPercentage = 100;
      } else {
        // Closer to 24h = higher percentage
        tempoPercentage = Math.max(0, Math.min(99, Math.floor((24 / profile.avgDeliveryHours) * 100)));
      }
    }

    badges.push({
      id: "mestre_do_tempo",
      name: "Mestre do Tempo",
      description: "Média de entrega em menos de 24h com no mínimo 5 missões concluídas",
      icon: "Clock",
      tier: "GOLD",
      status: isMestreDoTempo ? "UNLOCKED" : "LOCKED",
      progress: {
        current: tempoCurrent,
        target: tempoTarget,
        percentage: tempoPercentage
      }
    });

    // Badge 4: Veterano da Lente
    const hasVeterano = profile.totalMissions >= 10;
    badges.push({
      id: "veterano",
      name: "Veterano da Lente",
      description: "Concluiu mais de 10 missões na plataforma",
      icon: "Award",
      tier: "GOLD",
      status: hasVeterano ? "UNLOCKED" : "LOCKED",
      progress: {
        current: profile.totalMissions,
        target: 10,
        percentage: Math.min(100, Math.floor((profile.totalMissions / 10) * 100))
      }
    });

    // Badge 5: Parceiro de Elite
    const hasElite = profile.agilityPoints >= 300;
    badges.push({
      id: "parceiro_elite",
      name: "Parceiro de Elite",
      description: "Alcançou mais de 300 pontos de agilidade",
      icon: "Gem",
      tier: "DIAMOND",
      status: hasElite ? "UNLOCKED" : "LOCKED",
      progress: {
        current: profile.agilityPoints,
        target: 300,
        percentage: Math.min(100, Math.floor((profile.agilityPoints / 300) * 100))
      }
    });

    // Badge 6: Estrela da Vitrine
    const isEstrela = completeness === 100 && isSubscriber;
    let estrelaPercentage = completeness;
    if (completeness === 100 && !isSubscriber) {
      estrelaPercentage = 95; // Quase lá, falta assinar
    }
    badges.push({
      id: "estrela_vitrine",
      name: "Estrela da Vitrine",
      description: "Perfil 100% completo e assinatura Foto Segundo PRO ativa",
      icon: "Crown",
      tier: "DIAMOND",
      status: isEstrela ? "UNLOCKED" : "LOCKED",
      progress: {
        current: isEstrela ? 1 : 0,
        target: 1,
        percentage: estrelaPercentage
      }
    });

    return badges;
  }
}
