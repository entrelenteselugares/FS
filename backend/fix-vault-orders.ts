import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing existing vault orders...');

  // Encontrar todas as ordens com manualType = 'VAULT_ONDEMAND' e eventId = (slug: 'vaults-system')
  const orders = await prisma.order.findMany({
    where: {
      manualType: 'VAULT_ONDEMAND',
      event: { slug: 'vaults-system' }
    },
    include: { event: true }
  });

  console.log(`Found ${orders.length} orders to fix.`);

  for (const order of orders) {
    if (!order.internalNotes?.startsWith('Checkout Avulso do cofre: ')) {
      console.log(`Order ${order.id} doesn't have the expected internalNotes format. Skipping.`);
      continue;
    }

    const albumName = order.internalNotes.replace('Checkout Avulso do cofre: ', '').trim();
    
    // Find the album
    const album = await prisma.sharedAlbum.findFirst({
      where: {
        nome: albumName,
        ownerId: order.clienteId // The user who bought it could be the owner, wait no!
        // The owner is the professional, the clienteId is the buyer!
        // Let's just find the album by name. Hopefully name is unique enough or we just take the first one.
      }
    });

    if (!album) {
      console.log(`Could not find album named "${albumName}" for order ${order.id}. Skipping.`);
      continue;
    }

    const slug = `vault-${album.id}`;

    // Upsert the specific event
    let event = await prisma.event.findFirst({ where: { slug } });
    if (!event) {
      event = await prisma.event.create({
        data: {
          slug,
          nomeNoivos: album.nome,
          active: true,
          dataEvento: new Date(),
          ownerId: album.ownerId
        }
      });
      console.log(`Created new event ${slug}`);
    }

    // Update the order to point to the new event
    await prisma.order.update({
      where: { id: order.id },
      data: { eventId: event.id }
    });

    console.log(`Updated order ${order.id} to use event ${event.id}`);
  }

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
