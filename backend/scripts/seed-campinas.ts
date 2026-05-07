import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);
  const domain = 'campinas.com.br';

  console.log('🚀 Iniciando Seeding: Ecossistema Campinas...');

  // 1. ADMIN
  const admin = await prisma.user.upsert({
    where: { email: `admin@${domain}` },
    update: { senha: password },
    create: {
      nome: 'Admin Regional Campinas',
      email: `admin@${domain}`,
      senha: password,
      role: 'ADMIN',
      whatsapp: '19999990001',
      active: true,
    }
  });

  // 2. FRANQUEADO (Parceiro)
  const partner = await prisma.user.upsert({
    where: { email: `franquia@${domain}` },
    update: { senha: password },
    create: {
      nome: 'Franquia Master Campinas',
      email: `franquia@${domain}`,
      senha: password,
      role: 'FRANCHISEE',
      whatsapp: '19999990002',
      active: true,
      franchiseProfile: {
        create: {
          active: true,
          tier: 'BRONZE',
          printCredits: 1000,
        }
      }
    }
  });

  // 3. PROFISSIONAL (Fotógrafo)
  const proUser = await prisma.user.upsert({
    where: { email: `pro@${domain}` },
    update: { senha: password },
    create: {
      nome: 'Fotógrafo Pro Campinas',
      email: `pro@${domain}`,
      senha: password,
      role: 'PROFISSIONAL',
      whatsapp: '19999990003',
      active: true,
    }
  });

  const proProfile = await prisma.profissional.upsert({
    where: { userId: proUser.id },
    update: {
      hourlyRate: 150,
      experienceYears: 5,
      equipmentMultiplier: 1.5,
    },
    create: {
      userId: proUser.id,
      hourlyRate: 150,
      experienceYears: 5,
      equipmentMultiplier: 1.5,
      services: ['Eventos Sociais', 'Ensaios'],
      equipmentList: [{ name: 'Sony A7IV', value: 15000 }, { name: 'Lente 35mm 1.4', value: 8000 }],
    }
  });

  // Vincula o Profissional à Franquia
  await prisma.professionalNetwork.upsert({
    where: { userId_partnerId: { userId: partner.id, partnerId: proUser.id } },
    update: {},
    create: {
      user: { connect: { id: partner.id } },
      partner: { connect: { id: proUser.id } },
    }
  });

  // 4. CLIENTE
  const cliente = await prisma.user.upsert({
    where: { email: `cliente@${domain}` },
    update: { senha: password },
    create: {
      nome: 'Consumidor VIP Campinas',
      email: `cliente@${domain}`,
      senha: password,
      role: 'CLIENTE',
      whatsapp: '19999990004',
      active: true,
    }
  });

  // 5. EVENTO FLASH (Pronto para Venda)
  const event = await prisma.event.create({
    data: {
      nomeNoivos: 'Evento Teste Campinas',
      slug: `flash-campinas-${Date.now()}`,
      dataEvento: new Date(),
      captacao: { connect: { id: proUser.id } },
      captacaoStatus: 'ACCEPTED',
      active: true,
      isPrivate: false,
      pricePerPhoto: 1.00,
      clientEmail: cliente.email,
      location: 'Campinas - SP',
      type: 'FLASH_EVENT',
      media: {
        createMany: {
          data: [
            { url: 'https://images.unsplash.com/photo-1519741497674-611481863552', shortId: 'CPS01', price: 1 },
            { url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc', shortId: 'CPS02', price: 1 },
          ]
        }
      }
    }
  });

  console.log('\n✅ Ecossistema Campinas configurado com sucesso!');
  console.log(`📍 Evento pronto para compra: /e/${event.slug}`);
  console.log('--- Credenciais (Senha: 123456) ---');
  console.log(`Admin: admin@${domain}`);
  console.log(`Franquia: franquia@${domain}`);
  console.log(`Profissional: pro@${domain}`);
  console.log(`Cliente: cliente@${domain}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
