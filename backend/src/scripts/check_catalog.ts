import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.serviceCatalog.count();
  console.log(`CATALOG COUNT: ${count}`);
}

main().finally(() => prisma.$disconnect());
