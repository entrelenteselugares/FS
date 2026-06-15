import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Deletando contas fantasmas...');
  const result = await prisma.user.deleteMany({
    where: {
      email: {
        in: ['matheuskurio@gmail.com', 'entrelenteselugares@gmail.com']
      }
    }
  });
  console.log(`Foram deletadas ${result.count} contas fantasmas da base.`);
}

main().finally(() => prisma.$disconnect());
