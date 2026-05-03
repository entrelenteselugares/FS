import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const latestOrder = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { event: true, cliente: true }
  });

  if (!latestOrder) {
    console.log("❌ Nenhum pedido encontrado.");
    return;
  }

  console.log("--- 🕵️ AUDITORIA DE PEDIDO ---");
  console.log(`ID: ${latestOrder.id}`);
  console.log(`Status: ${latestOrder.status}`);
  console.log(`Valor: R$ ${latestOrder.valor}`);
  console.log(`Cliente: ${latestOrder.cliente?.nome} (${latestOrder.buyerEmail})`);
  console.log(`Evento: ${latestOrder.event?.nomeNoivos}`);
  console.log(`Data: ${latestOrder.createdAt}`);
  console.log("----------------------------");

  // Verifica se há fotos phygital pendentes para este evento
  const pendingPrints = await prisma.phygitalPrint.count({
    where: { eventId: latestOrder.eventId, status: 'PENDING_PRINT' }
  });
  console.log(`📸 Fotos Phygital aguardando impressão: ${pendingPrints}`);
}

main().finally(() => prisma.$disconnect());
