import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Quote" CASCADE;`);
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "quotes" CASCADE;`);
  console.log("Tables dropped");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
