import prisma from "../lib/prisma";
import { Deadline } from "../lib/deadline";

const CHUNK_SIZE = 100;

export async function processAbandonedCarts(): Promise<{ processed: number; skipped: boolean; elapsed: string }> {
  const deadline = new Deadline(50);
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  console.log("[AbandonedCartJob] Iniciando varredura de carrinhos abandonados...");

  try {
    const abandonedOrders = await prisma.order.findMany({
      where: {
        status: "PENDENTE",
        createdAt: { lte: twentyFourHoursAgo, gte: fortyEightHoursAgo },
        abandonedEmailSentAt: null,
      },
      include: { cliente: true, event: true },
      take: CHUNK_SIZE, // Nunca processa mais de 100 por execução
    });

    if (abandonedOrders.length === 0) {
      console.log("[AbandonedCartJob] Nenhum carrinho abandonado elegível encontrado.");
      return { processed: 0, skipped: false, elapsed: deadline.elapsedStr() };
    }

    let processed = 0;
    let hitDeadline = false;

    for (const order of abandonedOrders) {
      if (!deadline.ok()) {
        console.warn(`[AbandonedCartJob] ⚠️  Deadline atingido após ${processed} carrinhos. Restam ${abandonedOrders.length - processed} para a próxima execução.`);
        hitDeadline = true;
        break;
      }

      console.log(`[AbandonedCartJob] Disparando e-mail de recuperação para pedido ${order.id} (Cliente: ${order.cliente?.nome || order.buyerEmail})`);

      // TODO: Integrar com NotificationService.sendAbandonedCartEmail(order) quando o template estiver pronto
      await prisma.order.update({
        where: { id: order.id },
        data: { abandonedEmailSentAt: new Date() },
      });

      processed++;
    }

    console.log(`[AbandonedCartJob] Processados ${processed} carrinhos em ${deadline.elapsedStr()}.`);
    return { processed, skipped: hitDeadline, elapsed: deadline.elapsedStr() };
  } catch (error) {
    console.error("[AbandonedCartJob] Erro ao processar carrinhos abandonados:", error);
    throw error;
  }
}
