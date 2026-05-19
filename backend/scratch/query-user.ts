import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.user.update({
    where: { email: "fotografo@brasil.com.br" },
    data: { discoverySource: "referral" }
  });
  console.log("UPDATED USER:", JSON.stringify(updated, null, 2));
}

main().finally(() => prisma.$disconnect());
