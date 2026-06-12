const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'WORLD_CUP'`);
  console.log('Database Enum Updated successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
