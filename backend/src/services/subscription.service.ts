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

    const price = 49.90;

    // 3. Garantir Evento de Sistema para assinaturas
    let systemEvent = await prisma.event.findFirst({ where: { slug: "vaults-system" } });
    if (!systemEvent) {
      systemEvent = await prisma.event.create({
        data: {
          slug: "vaults-system",
          nomeNoivos: "System: Vaults Subscriptions",
          active: true,
          dataEvento: new Date(),
          ownerId: userId
        }
      });
    }

    // 4. Criar pedido local PENDING
    const order = await prisma.order.create({
      data: {
        valor: price,
        status: "PENDENTE",
        eventId: systemEvent.id,
        clienteId: userId,
        buyerEmail: album.owner.email,
        isManual: true,
        manualType: "VAULT_SUBSCRIPTION",
        internalNotes: `Assinatura Mensal: ${album.nome} | albumId:${albumId}`,
        items: { create: [{ price, quantity: 1 }] }
      }
    });

    // 5. Gerar preferência MP normal (funciona em qualquer conta/token)
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const mpResponse = await MercadoPagoService.createPreference({
      transaction_amount: price,
      description: `Assinatura Mensal Cofre: ${album.nome}`,
      payer_email: album.owner.email,
      notification_url: `${backendUrl}/api/webhooks/mercadopago`,
      orderId: order.id,
    });

    // 6. Registrar subscription PENDING
    const subscription = await prisma.subscription.upsert({
      where: { albumId },
      update: { status: "PENDING", planLimit, planPrice: price },
      create: { userId, albumId, planLimit, status: "PENDING", planPrice: price }
    });

    return {
      subscriptionId: subscription.id,
      initPoint: mpResponse.init_point,
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
        if (sub.albumId) {
          await prisma.sharedAlbum.update({
            where: { id: sub.albumId },
            data: { subscriptionStatus: "ACTIVE" },
          });
        }
        await GamificationService.processSubscriptionRewards(sub.userId, sub.id);
      } else if (newStatus === "CANCELED" || newStatus === "PAST_DUE") {
        if (sub.albumId) {
          await prisma.sharedAlbum.update({
            where: { id: sub.albumId },
            data: { subscriptionStatus: newStatus === "CANCELED" ? "EXPIRED" : "BLOCKED" },
          });
        }
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
