import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const orderId = 'cmo4u951q0001l204g2nunuiz';

async function main() {
  console.log('--- DIAGNÓSTICO DE PEDIDO ---');
  const order = await prisma.order.findFirst({
    where: { id: orderId }
  });

  if (!order) {
    console.error('❌ Pedido não encontrado!');
    return;
  }

  console.log('Estado Atual:', {
    id: order.id,
    status: order.status,
    paymentId: order.paymentId
  });

  if (order.status !== 'APROVADO') {
    console.log('\n--- LIBERANDO PEDIDO MANUALMENTE ---');
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'APROVADO',
        paymentId: 'manual_fix_' + Date.now()
      }
    });
    console.log('✅ Pedido Liberado com Sucesso:', updated.status);
  } else {
    console.log('\n✅ O pedido já consta como APROVADO no banco.');
  }
}

main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
