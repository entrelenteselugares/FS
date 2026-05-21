import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  try {
    const orderId = "cmpb7izfa0003kv04x7ukmmfd";
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { event: true, cliente: true }
    });

    if (!order) {
      console.log(`❌ Pedido ${orderId} não encontrado!`);
      return;
    }

    console.log("=== Pedido ===");
    console.log(`ID: ${order.id}`);
    console.log(`Status: ${order.status}`);
    console.log(`Pago: ${order.hasPaid}`);
    console.log(`Cliente Email: ${order.buyerEmail}`);

    if (order.event) {
      console.log("\n=== Evento ===");
      console.log(`ID: ${order.event.id}`);
      console.log(`Nome: ${order.event.nomeNoivos}`);
      console.log(`Ativo: ${order.event.active}`);
      console.log(`lightroomUrl: ${order.event.lightroomUrl}`);
      console.log(`driveUrl: ${order.event.driveUrl}`);
    } else {
      console.log("\n❌ Nenhum evento associado a este pedido.");
    }
  } catch (error) {
    console.error("Erro na verificação:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

verify();
