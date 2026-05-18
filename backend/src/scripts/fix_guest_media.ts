import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Buscando prints de Phygital...');
  const prints = await prisma.phygitalPrint.findMany({
    include: { event: true }
  });

  let count = 0;
  for (const p of prints) {
    const isProfessional = p.userId && (
      p.userId === p.event?.captacaoId ||
      p.userId === p.event?.edicaoId
    );

    if (!isProfessional) {
      // É de convidado, então a EventMedia correspondente (se existir) deve ser isGuest = true
      const media = await prisma.eventMedia.findFirst({
        where: { eventId: p.eventId, url: p.imageUrl }
      });

      if (media && !media.isGuest) {
        await prisma.eventMedia.update({
          where: { id: media.id },
          data: { isGuest: true }
        });
        count++;
        console.log(`Corrigido: ${media.shortId}`);
      }
    }
  }

  console.log(`Finalizado. Foram atualizadas ${count} mídias de convidados.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
