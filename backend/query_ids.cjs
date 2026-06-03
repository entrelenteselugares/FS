const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sa = await prisma.sharedAlbum.findUnique({ where: { id: 'cmpy62ief000vvzhcbycnp536' } });
  console.log('SharedAlbum cmpy62ief000vvzhcbycnp536:', sa);
}

main().catch(console.error).finally(() => prisma.$disconnect());
