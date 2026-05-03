const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const r = await prisma.calendarSlot.deleteMany();
  console.log('Deleted slots:', r.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
