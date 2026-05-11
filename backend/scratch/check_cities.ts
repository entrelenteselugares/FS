import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const cartorios = await prisma.cartorio.findMany({
    select: { id: true, razaoSocial: true, cidade: true, userId: true }
  });
  console.log("=== CARTORIOS ===");
  console.log(JSON.stringify(cartorios, null, 2));

  const events = await prisma.event.findMany({
    where: { city: null },
    select: { id: true, nomeNoivos: true, location: true, cartorioUserId: true },
    take: 5
  });
  console.log("\n=== EVENTS WITH NULL CITY (SAMPLE) ===");
  console.log(JSON.stringify(events, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
