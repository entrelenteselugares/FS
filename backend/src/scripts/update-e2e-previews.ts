import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

const PHOTOS = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
  'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80',
  'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800&q=80',
  'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80',
];

async function main() {
  const event = await prisma.event.findFirst({ where: { slug: 'e2e-marketplace-test' } });
  if (!event) { console.error('❌ Evento não encontrado.'); return; }

  await prisma.event.update({
    where: { id: event.id },
    data: { previewPhotos: JSON.stringify(PHOTOS) }
  });

  console.log('✅ previewPhotos atualizado para:', event.id);
  console.log('   Fotos:', PHOTOS.length);
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
