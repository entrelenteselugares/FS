const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { role: { in: ["PROFISSIONAL", "FRANCHISEE"] } }
  });
  console.log('Total Users with Role PROFISSIONAL/FRANCHISEE:', users.length);
  const allProf = await prisma.profissional.findMany({
    where: {
      user: {
        role: {
          in: ["PROFISSIONAL", "FRANCHISEE"]
        }
      }
    }
  });
  console.log('Total Profissionais with these roles:', allProf.length);
}
main().finally(() => prisma.$disconnect());
