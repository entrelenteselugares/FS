const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function repair() {
  console.log("Checking for users with missing profiles (Ultra-Minimal)...");
  
  const users = await prisma.user.findMany({
    include: {
      cartorio: true,
      profissional: true
    }
  });

  for (const user of users) {
    if (user.role === 'CARTORIO' && !user.cartorio) {
      console.log(`Creating missing Cartorio profile for ${user.email}...`);
      await prisma.cartorio.create({
        data: {
          userId: user.id,
          razaoSocial: user.nome
        }
      });
    }
    
    if (user.role === 'PROFISSIONAL' && !user.profissional) {
      console.log(`Creating missing Profissional profile for ${user.email}...`);
      await prisma.profissional.create({
        data: {
          userId: user.id,
          services: []
        }
      });
    }
  }

  console.log("Repair complete.");
}

repair()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
