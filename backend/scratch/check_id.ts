
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkId(id: string) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (event) {
    console.log('ID belongs to EVENT:', event.nomeNoivos);
    return;
  }
  const album = await prisma.sharedAlbum.findUnique({ where: { id } });
  if (album) {
    console.log('ID belongs to SHARED_ALBUM:', album.nome);
    return;
  }
  console.log('ID NOT FOUND in Event or SharedAlbum');
}

checkId('cmp0g4c750001l404g6vehckp').then(() => prisma.$disconnect());
