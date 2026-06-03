import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Sincronizando Cofres Retroativos para Pedidos Pagos...');
  
  const orders = await prisma.order.findMany({
    where: { status: 'PAID', deletedAt: null }, // Wait, the logs show "status": "APROVADO"!
    include: {
      event: true,
      items: {
        include: { media: true }
      }
    }
  });

  // also get APROVADO
  const ordersAprovado = await prisma.order.findMany({
    where: { status: 'APROVADO', deletedAt: null },
    include: {
      event: true,
      items: {
        include: { media: true }
      }
    }
  });

  const allOrders = [...orders, ...ordersAprovado];
  let created = 0;

  for (const order of allOrders) {
    const isFullDigitalAccess = order.internalNotes?.includes('"type":"HYBRID"') || 
                                order.internalNotes?.includes('"type":"ALBUM_FULL"') ||
                                order.event.type === 'ALBUM_FULL';
                                
    const mediaItems = order.items.filter(item => item.mediaId && item.media);
    
    if ((mediaItems.length > 0 || isFullDigitalAccess) && order.clienteId) {
      const vaultSlug = `vault-${order.eventId}-${order.clienteId}`;
      
      let album = await prisma.sharedAlbum.findUnique({ where: { slug: vaultSlug } });
      
      if (!album) {
        console.log(`✨ Criando Cofre para Pedido ${order.id}: ${vaultSlug}`);
        album = await prisma.sharedAlbum.create({
          data: {
            nome: order.event.title || "Meu Álbum Digital",
            slug: vaultSlug,
            goalPoses: 36,
            status: "OPEN",
            subscriptionStatus: "ACTIVE",
            ownerId: order.clienteId,
            members: {
              create: {
                userId: order.clienteId,
                role: "OWNER"
              }
            }
          }
        });
        created++;
      }

      let photosToLink = mediaItems.map(i => i.media!);
      if (isFullDigitalAccess) {
        const allMedia = await prisma.eventMedia.findMany({ where: { eventId: order.eventId, type: 'PHOTO' } });
        photosToLink = allMedia;
      }

      let linked = 0;
      for (const m of photosToLink) {
        const existingMedia = await prisma.sharedAlbumMedia.findFirst({
          where: { albumId: album.id, fileId: m.id }
        });
        
        if (!existingMedia) {
          await prisma.sharedAlbumMedia.create({
            data: {
              albumId: album.id,
              fileId: m.id,
              webViewLink: m.url,
              thumbnailLink: m.url,
              uploadedById: order.clienteId,
              status: 'APPROVED',
              type: m.type || 'PHOTO'
            }
          });
          linked++;
        }
      }
      if (linked > 0) {
        console.log(`  📸 ${linked} mídias adicionadas ao cofre ${album.slug}`);
      }
    }
  }

  console.log(`✅ Finalizado! ${created} cofres criados.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
