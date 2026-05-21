import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runCleanup() {
  try {
    console.log("🔍 Procurando eventos com links no formato de string 'null'...");

    // Find events with lightroomUrl === "null" or driveUrl === "null"
    const eventsToFix = await prisma.event.findMany({
      where: {
        OR: [
          { lightroomUrl: "null" },
          { driveUrl: "null" }
        ]
      }
    });

    console.log(`Found ${eventsToFix.length} events containing string "null" URLs.`);

    let updatedCount = 0;
    for (const event of eventsToFix) {
      const dataToUpdate: any = {};
      if (event.lightroomUrl === "null") {
        dataToUpdate.lightroomUrl = null;
      }
      if (event.driveUrl === "null") {
        dataToUpdate.driveUrl = null;
      }

      await prisma.event.update({
        where: { id: event.id },
        data: dataToUpdate
      });

      console.log(`Updated event: ${event.id} (${event.nomeNoivos})`);
      updatedCount++;
    }

    console.log(`✅ Concluído! ${updatedCount} eventos atualizados com sucesso.`);

  } catch (error) {
    console.error("❌ Erro ao limpar URLs do banco de dados:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

runCleanup();
