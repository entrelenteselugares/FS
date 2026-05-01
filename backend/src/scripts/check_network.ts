import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, nome: true } });
  console.log("USERS:", users);

  const network = await prisma.professionalNetwork.findMany({
    include: {
      user: { select: { email: true } },
      partner: { select: { email: true } }
    }
  });
  console.log("NETWORK ENTRIES:", network);
}

main().finally(() => prisma.$disconnect());
