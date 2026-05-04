const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.config.findMany();
  console.log('--- CHAVES ENCONTRADAS NO BANCO ---');
  configs.forEach(c => {
    console.log(`Key: ${c.key} | Label: ${c.label}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
