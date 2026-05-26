import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { 
      franchiseProfile: { isNot: null },
      role: { not: 'FRANCHISEE' }
    },
    data: { role: 'FRANCHISEE' }
  });
  console.log(`Updated ${result.count} users to FRANCHISEE role.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
