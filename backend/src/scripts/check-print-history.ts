import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const prints = await prisma.phygitalPrint.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  if (prints.length === 0) {
    console.log("❌ Nenhuma foto phygital registrada no banco.");
    return;
  }

  console.log("--- 🖨️ HISTÓRICO DE IMPRESSÃO (Últimas 5) ---");
  prints.forEach(p => {
    console.log(`[${p.status}] Ref: ${p.referenceCode} | Evento ID: ${p.eventId} | Criada em: ${p.createdAt}`);
  });
  console.log("------------------------------------------");
}

main().finally(() => prisma.$disconnect());
