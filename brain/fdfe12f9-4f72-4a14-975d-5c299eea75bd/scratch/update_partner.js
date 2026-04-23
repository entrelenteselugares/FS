const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const updated = await prisma.cartorio.update({
      where: { userId: '437ed196-8c2c-48f5-bea1-1272d1a2577e' },
      data: {
        cidade: 'Campinas',
        fixedDuration: 2
      }
    });
    console.log('Partner updated:', JSON.stringify(updated, null, 2));
  } catch (err) {
    console.error('Error updating DB:', err);
  }
}

main()
  .finally(async () => await prisma.$disconnect());
