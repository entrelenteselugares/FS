
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  console.log('Prisma keys:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
  
  // Try to find ANY config model
  const possibleNames = ['platformConfig', 'PlatformConfig', 'platform_configs', 'Platform_Configs'];
  for (const name of possibleNames) {
    if ((prisma as any)[name]) {
      console.log(`Found model with name: ${name}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
