import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      nome: true,
      role: true,
      createdAt: true
    }
  });

  console.log("=== USUÁRIOS NO BANCO DE DADOS (PRISMA) ===");
  console.table(users);
  console.log(`Total: ${users.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
