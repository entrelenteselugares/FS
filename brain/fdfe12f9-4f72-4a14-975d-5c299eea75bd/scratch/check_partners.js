const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const partners = await prisma.user.findMany({
      where: { role: 'CARTORIO' },
      include: { cartorio: true }
    });
    console.log('Partners found:', JSON.stringify(partners, null, 2));
  } catch (err) {
    console.error('Error querying DB:', err);
  }
}

main()
  .finally(async () => await prisma.$disconnect());
