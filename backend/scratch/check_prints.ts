
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkRecentPrints() {
  const prints = await prisma.phygitalPrint.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('RECENT PRINTS:', JSON.stringify(prints, null, 2));
}

checkRecentPrints().then(() => prisma.$disconnect());
