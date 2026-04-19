import "dotenv/config";
import prisma from "./lib/prisma";

async function cleanup() {
  console.log("🧹 Iniciando limpeza de duplicatas...");

  // Busca todos os eventos Julia & Ricardo
  const julias = await prisma.event.findMany({
    where: {
      OR: [
        { nomeNoivos: "Julia & Ricardo" },
        { nomeNoivos: "Exemplo: Julia & Ricardo" }
      ]
    },
    include: { pedidos: true }
  });

  console.log(`Encontrados ${julias.length} registros.`);

  if (julias.length > 1) {
    // Mantém o que tem pedidos, ou o mais antigo
    const toKeep = julias.find(j => j.pedidos.length > 0) || julias[0];
    const toDelete = julias.filter(j => j.id !== toKeep.id);

    for (const d of toDelete) {
      if (d.pedidos.length === 0) {
        await prisma.event.delete({ where: { id: d.id } });
        console.log(`🗑️ Deletada duplicata sem pedidos (ID: ${d.id})`);
      } else {
        console.log(`⚠️ Registro ${d.id} tem pedidos, não deletado.`);
      }
    }
  }

  console.log("✅ Limpeza concluída.");
}

cleanup().catch(console.error).finally(() => prisma.$disconnect());
