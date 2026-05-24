const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orderId = 'cmpihoafl0002la04eo98typs'; // O ID do seu pedido de teste
  
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  
  if (order) {
    if (order.status === 'PENDENTE') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELADO' }
      });
      console.log(`✅ Pedido ${orderId} cancelado com sucesso.`);
    } else {
      console.log(`⚠️ Pedido ${orderId} já está no status: ${order.status}`);
    }
  } else {
    console.log(`❌ Pedido ${orderId} não encontrado.`);
  }
}

main().finally(() => prisma.$disconnect());
