
import prisma from "../src/lib/prisma";

async function approveOrder(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { event: true, cliente: true }
    });

    if (!order) {
      console.error("Pedido não encontrado:", orderId);
      return;
    }

    console.log(`[Manual Approve] Aprovando pedido ${orderId} (${order.buyerEmail})`);

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "APROVADO", hasPaid: true }
    });

    // Ativa o evento se necessário
    if (order.eventId) {
      await prisma.event.update({
        where: { id: order.eventId },
        data: { active: true, isQuote: false }
      });
    }

    console.log("✅ Pedido aprovado com sucesso!");
  } catch (error) {
    console.error("Erro ao aprovar pedido:", error);
  } finally {
    process.exit(0);
  }
}

approveOrder("cmoaff2aj0001jr04qn32w1oh");
