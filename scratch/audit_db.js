const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditDB() {
  try {
    console.log('--- SHARED ALBUM MEDIA ---');
    const media = await prisma.sharedAlbumMedia.findMany({
      where: { albumId: 'cmp05xqtr0001l504sjo30noi' }
    });
    console.log(JSON.stringify(media, null, 2));

    console.log('\n--- SHARED ALBUM ---');
    const album = await prisma.sharedAlbum.findUnique({
      where: { id: 'cmp05xqtr0001l504sjo30noi' }
    });
    console.log(JSON.stringify(album, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

auditDB();
