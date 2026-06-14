import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user1 = await prisma.user.findUnique({ 
    where: { email: "matheuskurio@gmail.com" },
    include: {
      franchiseProfile: {
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      },
      gamificationLogs: {
        orderBy: { createdAt: 'desc' },
        take: 20
      },
      subscriptions: {
        where: {
          type: 'ALBUM_SANFONA',
          status: 'ACTIVE'
        }
      }
    }
  });
  console.log(JSON.stringify(user1, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
