const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { email: 'test@fotosegundo.com' },
    data: { role: 'PROFESSIONAL', professionalStatus: 'APPROVED' }
  });
  console.log(user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
