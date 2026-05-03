import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const email = `guest-${Date.now()}@example.test`;
  
  // Encontra um evento de marketplace para o teste
  const event = await prisma.event.findFirst({
    where: { type: 'PHOTO_MARKETPLACE', active: true }
  });

  if (!event) {
    console.error('Nenhum evento de marketplace encontrado para o teste.');
    process.exit(1);
  }

  const order = await prisma.order.create({
    data: {
      eventId: event.id,
      valor: 1.00,
      status: 'PENDENTE',
      isGuestOrder: true,
      guestEmail: email,
      guestToken: crypto.randomBytes(32).toString('hex'),
      buyerEmail: email,
      manualType: 'Guest Checkout Test'
    }
  });

  console.log(JSON.stringify({
    orderId: order.id,
    guestToken: order.guestToken,
    email: email
  }));

  await prisma.$disconnect();
}

main();
