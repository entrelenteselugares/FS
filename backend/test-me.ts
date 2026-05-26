import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ 
    where: { id: "11db782b-45ae-4ca7-8e0f-eebb761e9588" },
    include: {
      franchiseProfile: {
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      },
      gamificationLedger: {
        orderBy: { createdAt: 'desc' },
        take: 20
      }
    }
  });
  console.log(JSON.stringify(user?.franchiseProfile, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
