import { prisma } from "../lib/prisma";
import { MercadoPagoService } from "./mercadopago.service";
import { SubscriptionStatus } from "@prisma/client";

import { GamificationService } from "./gamification.service";

export class SubscriptionService {
  /**
   * Inicializa uma assinatura para um Cofre de Memórias.
   * Cria o registro PENDING e gera a URL de checkout no gateway.
   */
  static async createVaultSubscription(userId: string, albumId: string, planLimit: number = 36) {
    // 1. Verifica se já existe assinatura para este cofre
    const existing = await prisma.subscription.findUnique({
      where: { albumId }
    });

    if (existing && existing.status === "ACTIVE") {
      throw new Error("Este cofre já possui uma assinatura ativa.");
    }

    // 2. Busca dono do cofre para o email
    const album = await prisma.sharedAlbum.findUnique({
      where: { id: albumId },
      include: { owner: true }
    });

    if (!album) throw new Error("Cofre não encontrado.");
    if (album.ownerId !== userId) throw new Error("Apenas o proprietário pode assinar este cofre.");

    const price = 49.90; // Exemplo de preço da assinatura mensal

    // 3. Integração com Mercado Pago (Preapproval)
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    
    const mpResponse = await MercadoPagoService.createPreapproval({
      reason: `Cofre Mensal: ${album.nome}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: price,
        currency_id: "BRL",
      },
      payer_email: album.owner.email,
      back_url: `${frontendUrl}/vaults/${albumId}?subscribed=true`,
      notification_url: `${backendUrl}/api/webhooks/mp-subscription`,
    });

    // 4. Cria (ou atualiza) registro local PENDING com preapprovalId
    const subscription = await prisma.subscription.upsert({
      where: { albumId },
      update: {
        status: "PENDING",
        planLimit,
        preapprovalId: mpResponse.id,
        planPrice: price
      },
      create: {
        userId,
        albumId,
        planLimit,
        status: "PENDING",
        preapprovalId: mpResponse.id,
        planPrice: price
      }
    });

    return {
      subscriptionId: subscription.id,
      initPoint: mpResponse.init_point,
      preapprovalId: mpResponse.id,
      amount: price
    };
  }

  /**
   * Processa webhook de Preapproval (Assinaturas)
   */
  static async handlePreapprovalWebhook(preapprovalId: string) {
    try {
      const mpData = await MercadoPagoService.getPreapproval(preapprovalId);
      
      const statusMap: Record<string, SubscriptionStatus> = {
        authorized: "ACTIVE",
        paused: "PAST_DUE",
        cancelled: "CANCELED",
        pending: "PENDING",
      };
      
      const newStatus = statusMap[mpData.status] ?? "PENDING";
      
      const sub = await prisma.subscription.findFirst({ where: { preapprovalId } });
      if (!sub) {
        console.warn(`[MP Webhook] Subscription not found for preapprovalId: ${preapprovalId}`);
        return;
      }
      
      const nextBillingDate = newStatus === "ACTIVE" && mpData.next_payment_date
        ? new Date(mpData.next_payment_date)
        : undefined;

      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: newStatus,
          nextBillingDate
        },
      });

      if (newStatus === "ACTIVE") {
        await prisma.sharedAlbum.update({
          where: { id: sub.albumId },
          data: { subscriptionStatus: "ACTIVE" },
        });
        await GamificationService.processSubscriptionRewards(sub.userId, sub.id);
      } else if (newStatus === "CANCELED" || newStatus === "PAST_DUE") {
        await prisma.sharedAlbum.update({
          where: { id: sub.albumId },
          data: { subscriptionStatus: newStatus === "CANCELED" ? "EXPIRED" : "BLOCKED" },
        });
      }
      
      console.log(`[MP Webhook] Processed preapproval ${preapprovalId} - New status: ${newStatus}`);
    } catch (error) {
      console.error(`[MP Webhook] Error processing preapproval ${preapprovalId}:`, error);
      throw error;
    }
  }

  /**
   * Processa a atualização de status vinda do webhook (ex: Pix Automático Pago)
   */
  static async handleSubscriptionPayment(gatewaySubId: string, status: string) {
    let subStatus: SubscriptionStatus = "PENDING";
    
    if (status === "approved" || status === "authorized") {
      subStatus = "ACTIVE";
    } else if (status === "cancelled") {
      subStatus = "CANCELED";
    }

    const nextBilling = new Date();
    nextBilling.setDate(nextBilling.getDate() + 30); // 30 dias de ciclo

    await prisma.subscription.updateMany({
      where: { gatewaySubId },
      data: {
        status: subStatus,
        nextBillingDate: subStatus === "ACTIVE" ? nextBilling : undefined
      }
    });

    const updatedSub = await prisma.subscription.findFirst({ where: { gatewaySubId } });
    
    if (updatedSub && subStatus === "ACTIVE") {
      await GamificationService.processSubscriptionRewards(updatedSub.userId, updatedSub.id);
    }
  }
}
