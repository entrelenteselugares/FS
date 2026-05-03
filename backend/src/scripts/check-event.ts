import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const slug = process.argv[2];

async function main() {
  if (!slug) {
    console.log("Uso: npx tsx check-event.ts <slug_ou_id>");
    return;
  }

  const event = await prisma.event.findFirst({
    where: { OR: [{ id: slug }, { slug: slug }] },
    include: { 
      _count: { select: { media: true, phygitalPrints: true } } 
    }
  });

  if (!event) {
    console.log("❌ Evento não encontrado.");
    return;
  }

  console.log("--- 🕵️ DETALHES DO EVENTO ---");
  console.log(`ID: ${event.id}`);
  console.log(`Slug: ${event.slug}`);
  console.log(`Tipo: ${event.type}`);
  console.log(`Ativo: ${event.active}`);
  console.log(`Privado: ${event.isPrivate}`);
  console.log(`Media (Photos): ${event._count.media}`);
  console.log(`Phygital Prints: ${event._count.phygitalPrints}`);
  console.log("----------------------------");
}

main().finally(() => prisma.$disconnect());
