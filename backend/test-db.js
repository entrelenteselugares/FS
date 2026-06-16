const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.event.findFirst({ where: { slug: 'fp-avenida-paulista-9le9' }, select: { coverPhotoUrl: true } })
  .then(e => console.log('COVER:', e))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
