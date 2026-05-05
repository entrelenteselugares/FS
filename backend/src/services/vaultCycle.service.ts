import { prisma } from "../lib/prisma";
import { GoogleDriveService } from "./googleDrive.service";

export class VaultCycleService {
  /**
   * Executa o fechamento de ciclo para um cofre específico.
   * Seleciona as fotos mais votadas e gera a ordem de produção.
   */
  static async closeVaultCycle(albumId: string) {
    console.log(`[VAULT CYCLE] Iniciando fechamento do cofre: ${albumId}`);

    // 1. Busca o cofre e a assinatura ativa
    const album = await prisma.sharedAlbum.findUnique({
      where: { id: albumId },
      include: {
        subscription: true,
        owner: true,
        media: {
          include: {
            votes: true
          }
        }
      }
    });

    if (!album || !album.subscription || album.subscription.status !== "ACTIVE") {
      console.error(`[VAULT CYCLE] Erro: Cofre ${albumId} não possui assinatura ativa.`);
      return;
    }

    const limit = album.subscription.planLimit;

    // 2. Motor de Seleção: Ordenar mídias por número de votos
    const sortedMedia = album.media.sort((a, b) => (b.votes.length || 0) - (a.votes.length || 0));
    const selectedMedia = sortedMedia.slice(0, limit);

    if (selectedMedia.length === 0) {
      console.log(`[VAULT CYCLE] Nenhuma mídia encontrada para o cofre ${albumId}.`);
      return;
    }

    console.log(`[VAULT CYCLE] Selecionadas ${selectedMedia.length} fotos baseadas em votos.`);

    // 3. Garantir Evento de Sistema para ancorar o pedido
    let systemEvent = await prisma.event.findFirst({
      where: { slug: "clube-recorrencia" }
    });

    if (!systemEvent) {
      systemEvent = await prisma.event.create({
        data: {
          slug: "clube-recorrencia",
          nomeNoivos: "Sistema: Clube de Memórias",
          active: true,
          dataEvento: new Date(),
          ownerId: album.ownerId // Vinculado ao primeiro dono que disparou, ou um admin
        }
      });
    }

    // 4. Gerar Pedido no Order Engine (Custo Zero para o Cliente)
    const order = await prisma.order.create({
      data: {
        eventId: systemEvent.id,
        clienteId: album.ownerId,
        buyerEmail: album.owner.email,
        valor: 0, // Já pago via assinatura
        status: "PAGO",
        paymentMethod: "FREE", 
        paymentModel: "PRE_PAID",
        deliveryType: "SHIPPING",
        fulfillmentStatus: "PENDING",
        internalNotes: JSON.stringify({
          type: "VAULT_CYCLE_CLOSURE",
          albumId,
          subscriptionId: album.subscription.id,
          selectedMediaIds: selectedMedia.map(m => m.id)
        }),
        items: {
          create: selectedMedia.map(m => ({
            price: 0,
            quantity: 1
          }))
        }
      }
    });

    // 4. Atualizar o ciclo da assinatura
    const nextBilling = new Date(album.subscription.nextBillingDate || new Date());
    nextBilling.setMonth(nextBilling.getMonth() + 1);

    await prisma.subscription.update({
      where: { id: album.subscription.id },
      data: {
        nextBillingDate: nextBilling,
        updatedAt: new Date()
      }
    });

    console.log(`[VAULT CYCLE] Ciclo concluído. Pedido #${order.id} gerado.`);
    return order;
  }

  /**
   * Varre todas as assinaturas e processa as que venceram hoje.
   */
  static async processAllDueSubscriptions() {
    const today = new Date();
    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        nextBillingDate: {
          lte: today
        }
      }
    });

    console.log(`[VAULT CYCLE] Processando ${dueSubscriptions.length} assinaturas vencidas.`);

    for (const sub of dueSubscriptions) {
      try {
        await this.closeVaultCycle(sub.albumId);
      } catch (err) {
        console.error(`[VAULT CYCLE] Erro ao processar album ${sub.albumId}:`, err);
      }
    }
  }
}
