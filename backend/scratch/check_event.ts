import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const event = await prisma.event.findUnique({
    where: { slug: 'e2e-marketplace-test' }
  });
  
  if (event) {
    console.log("EVENT_EXISTS");
    console.log(`ID: ${event.id}`);
    console.log(`Title: ${event.nomeNoivos}`);
  } else {
    console.log("EVENT_MISSING");
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
