const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== RECENT ORDERS ===");
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { items: true, cliente: true }
  });
  console.log(JSON.stringify(orders, null, 2));

  console.log("=== RECENT CREDIT TRANSACTIONS ===");
  const txs = await prisma.creditTransaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(txs, null, 2));
  
  console.log("=== RECENT AFFILIATE COMMISSIONS ===");
  const aff = await prisma.affiliateCommission.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(aff, null, 2));

  console.log("=== RECENT NOTIFICATIONS ===");
  const notifs = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(notifs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
