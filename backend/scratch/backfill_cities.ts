import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=== INICIANDO BACKFILL DE CIDADES ===");
  
  const events = await prisma.event.findMany({
    where: { city: null, cartorioUserId: { not: null } },
    include: { cartorioUser: { include: { cartorio: true } } }
  });

  console.log(`Encontrados ${events.length} eventos para atualizar.`);

  for (const ev of events) {
    const city = ev.cartorioUser?.cartorio?.cidade;
    if (city) {
      console.log(`Atualizando evento ${ev.id} (${ev.nomeNoivos}) -> ${city}`);
      await prisma.event.update({
        where: { id: ev.id },
        data: { city }
      });
    }
  }

  console.log("=== BACKFILL CONCLUIDO ===");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
