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

    // 3. Cria (ou atualiza) registro local PENDING
    const subscription = await prisma.subscription.upsert({
      where: { albumId },
      update: {
        status: "PENDING",
        planLimit
      },
      create: {
        userId,
        albumId,
        planLimit,
        status: "PENDING"
      }
    });

    // 4. Garantir Evento de Sistema para cobranças de Cofre
    let systemEvent = await prisma.event.findFirst({
      where: { slug: "vaults-system" }
    });

    if (!systemEvent) {
      systemEvent = await prisma.event.create({
        data: {
          slug: "vaults-system",
          nomeNoivos: "System: Vaults Orders",
          active: true,
          dataEvento: new Date(),
          ownerId: userId
        }
      });
    }

    // 5. Criar um Pedido (Order) vinculado a esta assinatura para usar o checkout transparente
    const order = await prisma.order.create({
      data: {
        valor: price,
        status: "PENDENTE",
        eventId: systemEvent.id,
        clienteId: userId,
        buyerEmail: album.owner.email,
        deliveryType: "SHIPPING",
        fulfillmentStatus: "PENDING",
        isManual: true,
        manualType: "VAULT_CYCLE",
        internalNotes: `Assinatura do cofre: ${album.nome} | SubId: ${subscription.id}`,
      }
    });

    return {
      subscriptionId: subscription.id,
      orderId: order.id,
      amount: price
    };
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
