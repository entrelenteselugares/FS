import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['unidade-sp@brasil.com.br', 'unidade-rj@brasil.com.br', 'unidade-mg@brasil.com.br']
      }
    }
  });
  console.log('Deleted successfully');
}

main().finally(() => prisma.$disconnect());
