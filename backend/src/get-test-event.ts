import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const event = await prisma.event.findFirst({ select: { id: true, nomeNoivos: true, slug: true } });
  console.log(JSON.stringify(event));
}
main();
