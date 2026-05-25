/**
 * Seed de Evento para E2E Tests
 * Cria um evento PHOTO_MARKETPLACE com 5 PhygitalPrints (fotos clicáveis) e
 * preço de R$ 1,00 para Penny Testing.
 *
 * Run: npx tsx backend/src/scripts/seed-e2e-event.ts
 * É IDEMPOTENTE — pode rodar múltiplas vezes sem duplicar.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fotos de demonstração (Unsplash, sem direitos autorais)
const SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
  'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80',
  'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800&q=80',
  'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80',
];

async function main() {
  console.log('🌱 Verificando/criando evento E2E de teste...');

  const existingSlug = 'e2e-marketplace-test';

  // Verifica se já existe
  const existing = await prisma.event.findFirst({
    where: { slug: existingSlug },
    include: { _count: { select: { phygitalPrints: true } } }
  });

  if (existing) {
    if (existing._count.phygitalPrints > 0) {
      console.log(`✅ Evento já configurado corretamente:`);
      console.log(`   ID:    ${existing.id}`);
      console.log(`   Fotos: ${existing._count.phygitalPrints}`);
      console.log(`   URL:   http://localhost:3000/e/${existingSlug}`);
      return;
    }
    // Existe mas sem fotos — adiciona as fotos
    console.log(`⚠️  Evento existe mas sem fotos. Adicionando PhygitalPrints...`);
    await seedPrints(existing.id);
    console.log(`✅ Fotos adicionadas ao evento ${existing.id}`);
    return;
  }

  // Encontra o admin para vincular
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.error('❌ Nenhum usuário ADMIN encontrado. Rode o seed-admin.ts primeiro.');
    process.exit(1);
  }

  // Cria o evento
  const event = await prisma.event.create({
    data: {
      title:   'E2E Marketplace Test',
      slug:         existingSlug,
      type:         'PHOTO_MARKETPLACE',
      active:       true,
      isPrivate:    false,
      pricePerPhoto: 1.00,   // Penny Testing
      priceUnit:    1.00,
      priceBase:    1.00,
      dataEvento:   new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
      captacaoId:   admin.id,
      description:  '[E2E TEST] Não remova este evento — usado em testes automatizados.',
    }
  });

  console.log(`✅ Evento criado: ${event.id}`);

  // Cria as fotos como PhygitalPrints
  await seedPrints(event.id);

  console.log(`\n🔗 URLs para os specs E2E:`);
  console.log(`   Slug:  e2e-marketplace-test`);
  console.log(`   ID:    ${event.id}`);
  console.log(`   URL:   http://localhost:3000/e/${existingSlug}`);
}

async function seedPrints(eventId: string) {
  for (let i = 0; i < SAMPLE_PHOTOS.length; i++) {
    await prisma.phygitalPrint.create({
      data: {
        eventId,
        referenceCode:  `E2E-TEST-${Date.now()}-${i}`,
        imageUrl:       SAMPLE_PHOTOS[i],
        customerName:   'E2E Test Customer',
        customerPhone:  '19997843817',
        customerCep:    '13092-150',
        status:         'PENDING_PRINT',
      }
    });
  }
  console.log(`📸 ${SAMPLE_PHOTOS.length} fotos (PhygitalPrints) criadas.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
