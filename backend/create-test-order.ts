import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Pega o primeiro evento disponível para vincular o pedido
  const event = await prisma.event.findFirst();
  if (!event) {
    console.error('Nenhum evento encontrado no banco.');
    return;
  }

  const order = await prisma.order.create({
    data: {
      eventId: event.id,
      valor: 1.00,
      status: 'PENDENTE',
      buyerEmail: 'validador@test.com',
      manualType: 'Validação Técnica R$ 1.00',
      isGuestOrder: true,
    }
  });

  console.log(`ORDER_ID:${order.id}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
