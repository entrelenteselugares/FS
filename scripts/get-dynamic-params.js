const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const flash = await prisma.flashCard.findFirst();
    console.log('FlashCard shortId:', flash ? flash.shortId : 'None');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
