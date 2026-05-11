
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedTestUsers() {
  const password = await bcrypt.hash('123456', 10);
  const domain = 'campinas.com.br';

  const users = [
    { nome: 'Pro Campinas 1', email: `pro1@${domain}`, role: 'PROFISSIONAL' },
    { nome: 'Pro Campinas 2', email: `pro2@${domain}`, role: 'PROFISSIONAL' },
    { nome: 'Unidade Campinas 1', email: `fixa1@${domain}`, role: 'CARTORIO' },
    { nome: 'Unidade Campinas 2', email: `fixa2@${domain}`, role: 'CARTORIO' },
    { nome: 'Cliente Campinas 1', email: `cliente1@${domain}`, role: 'CLIENTE' },
    { nome: 'Cliente Campinas 2', email: `cliente2@${domain}`, role: 'CLIENTE' },
  ];

  console.log('--- SEEDING TEST USERS ---');
  for (const u of users) {
    try {
      const created = await prisma.user.upsert({
        where: { email: u.email },
        update: { role: u.role as any },
        create: {
          nome: u.nome,
          email: u.email,
          senha: password,
          role: u.role as any,
          whatsapp: '19900000000',
          isVerified: true
        }
      });
      console.log(`[OK] ${u.role}: ${u.email}`);

      // Se for profissional, garante que o perfil exista
      if (u.role === 'PROFISSIONAL') {
        await prisma.profissional.upsert({
          where: { userId: created.id },
          update: {},
          create: {
            userId: created.id,
            services: ['FOTO', 'VÍDEO'],
            experienceYears: 5,
            isExperienceValidated: true
          }
        });
      }
      
      // Se for Cartorio/Unidade, garante que o perfil exista (se aplicável)
      if (u.role === 'CARTORIO') {
          // Adicione lógica de perfil de unidade se necessário
      }

    } catch (err) {
      console.error(`[FAIL] ${u.email}:`, err);
    }
  }
}

seedTestUsers().then(() => prisma.$disconnect());
