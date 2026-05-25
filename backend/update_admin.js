const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.user.updateMany({
    where: { email: 'contatofotosegundo@gmail.com' },
    data: { role: 'ADMIN' }
  });
  console.log("Updated to ADMIN: ", result.count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
