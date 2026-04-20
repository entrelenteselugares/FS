const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'foto@teste.com' }
  });
  
  if (user) {
    console.log('--- USER FOUND ---');
    console.log(JSON.stringify(user, null, 2));
  } else {
    console.log('--- USER NOT FOUND ---');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
