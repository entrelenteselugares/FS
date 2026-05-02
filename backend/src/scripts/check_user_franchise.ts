import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const email = 'matheuskurio@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      franchiseProfile: true
    }
  });

  if (!user) {
    console.log(`User ${email} not found.`);
  } else {
    console.log(`User: ${user.nome} (${user.email})`);
    console.log(`Role: ${user.role}`);
    console.log(`Franchise Profile:`, user.franchiseProfile ? 'ACTIVE' : 'NONE');
    if (user.franchiseProfile) {
      console.log(`Profile ID: ${user.franchiseProfile.id}`);
      console.log(`Active: ${user.franchiseProfile.active}`);
    }
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
