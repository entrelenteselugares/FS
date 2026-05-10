
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const franchisees = await prisma.user.findMany({
    where: {
      franchiseProfile: { isNot: null }
    },
    include: {
      franchiseProfile: {
        include: {
          events: { select: { id: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('Franchisees count:', franchisees.length);
  console.log(JSON.stringify(franchisees, null, 2));

  const orders = await prisma.supplyOrder.findMany({
    include: { 
      items: true,
      franchisee: { select: { nome: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  console.log('Orders count:', orders.length);
  console.log(JSON.stringify(orders, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
