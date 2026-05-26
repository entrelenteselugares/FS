import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'FRANCHISEE' },
    include: { franchiseProfile: true }
  });
  console.log(JSON.stringify(users.map(u => ({ id: u.id, name: u.nome, role: u.role, franchiseProfile: u.franchiseProfile })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
