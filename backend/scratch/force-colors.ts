import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.platformConfig.update({
    where: { key: 'brand_primary' },
    data: { value: '#85B9AC' }
  });
  await prisma.platformConfig.update({
    where: { key: 'brand_tactical' },
    data: { value: '#85B9AC' }
  });
  console.log('✅ Brand colors forced to #85B9AC in DB');
}

main().catch(console.error).finally(() => prisma.$disconnect());
