const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      nomeNoivos: true,
      dataEvento: true,
      createdAt: true
    }
  });
  console.log(JSON.stringify(events, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
