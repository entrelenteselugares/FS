const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.profissional.count();
  console.log('Total Profissionais:', count);
}
main().finally(() => prisma.$disconnect());
