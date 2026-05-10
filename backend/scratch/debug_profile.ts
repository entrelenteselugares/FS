
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const profile = await prisma.franchiseProfile.findFirst({
    where: { user: { email: 'matheuskurio@gmail.com' } }
  });
  console.log(JSON.stringify(profile, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
