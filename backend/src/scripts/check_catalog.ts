import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const catalog = await prisma.serviceCatalog.findMany();
  console.log("CATALOG:", JSON.stringify(catalog, null, 2));
}

main().finally(() => prisma.$disconnect());
