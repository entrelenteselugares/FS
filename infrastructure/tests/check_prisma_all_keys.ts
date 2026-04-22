
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const keys = Object.keys(prisma);
  console.log('ALL KEYS:', keys);
  
  // Directly check the property
  console.log('platformConfig exists?', 'platformConfig' in prisma);
  console.log('weeklyPayout exists?', 'weeklyPayout' in prisma);
  console.log('user exists?', 'user' in prisma);

  await prisma.$disconnect();
}

main().catch(console.error);
