import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando correção de cidades para eventos Foto Point e Flash Event...");

  const events = await prisma.event.findMany({
    where: {
      type: { in: ["FOTO_POINT", "FLASH_EVENT"] },
      city: null,
    },
  });

  console.log(`Encontrados ${events.length} eventos precisando de correção.`);

  let updatedCount = 0;
  for (const event of events) {
    await prisma.event.update({
      where: { id: event.id },
      data: { city: "Campinas" },
    });
    updatedCount++;
    console.log(`- Atualizado evento: ${event.nomeNoivos} (${event.id}) -> city: "Campinas"`);
  }

  console.log(`Concluído. Total atualizados: ${updatedCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
