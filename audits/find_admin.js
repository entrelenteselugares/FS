const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findAdmin() {
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { email: true }
  });
  console.log('ADMIN_EMAIL:' + (admin ? admin.email : 'NOT_FOUND'));
  await prisma.$disconnect();
}

findAdmin().catch(console.error);
