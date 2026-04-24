const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- AUDITORIA DE STATUS DE PEDIDOS (CLIENTE BACKEND) ---');
  try {
    const orders = await prisma.order.findMany({
      select: { status: true }
    });
    
    const counts = {};
    orders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    
    console.log('Distribuição de Status:', counts);
    
    const events = await prisma.event.findMany({
        select: { active: true, isQuote: true }
    });
    const eventCounts = { active: 0, inactive: 0, quote: 0 };
    events.forEach(e => {
        if (e.isQuote) eventCounts.quote++;
        else if (e.active) eventCounts.active++;
        else eventCounts.inactive++;
    });
    console.log('Distribuição de Eventos:', eventCounts);

  } catch (err) {
    console.error('ERRO:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
