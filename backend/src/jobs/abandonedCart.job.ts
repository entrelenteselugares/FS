import prisma from "../lib/prisma";

export async function processAbandonedCarts() {
  console.log("[AbandonedCartJob] Iniciando varredura de carrinhos abandonados...");

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  try {
    const abandonedOrders = await prisma.order.findMany({
      where: {
        status: "PENDENTE",
        createdAt: {
          lte: twentyFourHoursAgo,
          gte: fortyEightHoursAgo
        },
        abandonedEmailSentAt: null
      },
      include: {
        cliente: true,
        event: true
      }
    });

    if (abandonedOrders.length === 0) {
      console.log("[AbandonedCartJob] Nenhum carrinho abandonado elegível encontrado.");
      return;
    }

    for (const order of abandonedOrders) {
      // O e-mail idealmente seria disparado via um NotificationService (ex: SendGrid ou Resend)
      // NotificationService.sendAbandonedCartEmail(order);
      console.log(`[AbandonedCartJob] Disparando e-mail de recuperação para pedido ${order.id} (Cliente: ${order.cliente?.nome || order.buyerEmail})`);

      await prisma.order.update({
        where: { id: order.id },
        data: { abandonedEmailSentAt: new Date() }
      });
    }

    console.log(`[AbandonedCartJob] Processados ${abandonedOrders.length} carrinhos abandonados.`);
  } catch (error) {
    console.error("[AbandonedCartJob] Erro ao processar carrinhos abandonados:", error);
  }
}
