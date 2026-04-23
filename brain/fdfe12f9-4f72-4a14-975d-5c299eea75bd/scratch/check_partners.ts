import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const partners = await prisma.user.findMany({
    where: { role: 'CARTORIO' },
    include: { cartorio: true }
  });
  console.log('Partners found:', JSON.stringify(partners, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
