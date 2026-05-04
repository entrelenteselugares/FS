const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const eventId = 'cmok4pb3s0004jo04hxon5kdw';
  const email = 'hojetemchocolatebr@gmail.com';

  // 1. Deletar pedidos associados
  const delOrders = await prisma.order.deleteMany({
    where: { eventId }
  });
  console.log(`Deletados ${delOrders.count} pedidos.`);

  // 2. Deletar evento
  const delEvent = await prisma.event.delete({
    where: { id: eventId }
  });
  console.log(`Evento ${delEvent.nomeNoivos} deletado.`);

  // 3. Deletar usuário se ele não tiver outros pedidos (opcional, mas bom para limpeza)
  const user = await prisma.user.findUnique({
    where: { email },
    include: { pedidos: true }
  });

  if (user && user.pedidos.length === 0 && user.role === 'CLIENTE') {
     // Aqui precisaríamos deletar do Supabase também se quisermos limpeza total,
     // mas por enquanto deletamos do Prisma.
     await prisma.user.delete({ where: { email } });
     console.log(`Usuário ${email} deletado do Prisma.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
