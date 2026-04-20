import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.platformConfig.findMany({
    where: { key: { in: ["brand_primary", "brand_tactical"] } }
  });
  console.log("DATABASE_VALUES:");
  console.log(JSON.stringify(configs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
