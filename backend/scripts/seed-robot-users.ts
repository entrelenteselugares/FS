import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const USERS = [
  { nome: 'BR PRO Fotografo', email: 'fotografo@brasil.com.br', role: 'PROFISSIONAL' },
  { nome: 'BR PRO Editor', email: 'editor@brasil.com.br', role: 'PROFISSIONAL' },
  { nome: 'BR PRO Hibrido', email: 'hibrido@brasil.com.br', role: 'PROFISSIONAL' },
  { nome: 'BR PRO Mobile', email: 'mobile@brasil.com.br', role: 'PROFISSIONAL' },
  { nome: 'BR PRO Mobile Hibrido', email: 'mobile-hibrido@brasil.com.br', role: 'PROFISSIONAL' },
  { nome: 'BR Unidade SP', email: 'unidade-sp@brasil.com.br', role: 'CARTORIO' },
  { nome: 'BR Unidade RJ', email: 'unidade-rj@brasil.com.br', role: 'CARTORIO' },
  { nome: 'BR Unidade MG', email: 'unidade-mg@brasil.com.br', role: 'CARTORIO' },
  { nome: 'Franqueado Bronze', email: 'franqueado-bronze@brasil.com.br', role: 'PROFISSIONAL' },
  { nome: 'Franqueado Ouro', email: 'franqueado-ouro@brasil.com.br', role: 'PROFISSIONAL' },
  { nome: 'Franqueado Diamante', email: 'franqueado-diamante@brasil.com.br', role: 'PROFISSIONAL' },
  { nome: 'Consumidor VIP', email: 'cliente-vip@brasil.com.br', role: 'CLIENTE' },
  { nome: 'Consumidor Novo', email: 'cliente-novo@brasil.com.br', role: 'CLIENTE' },
];

async function main() {
  const hash = await bcrypt.hash('123456', 10);
  console.log('🌱 Povoando usuários do Usability Robot...');

  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role as any, senha: hash, active: true },
      create: {
        nome: u.nome,
        email: u.email,
        senha: hash,
        role: u.role as any,
        active: true,
      }
    });
    
    if (u.role === 'PROFISSIONAL') {
      await prisma.profissional.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id }
      });
    } else if (u.role === 'CARTORIO') {
      await prisma.cartorio.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, razaoSocial: u.nome }
      });
    }
    
    console.log(`✅ ${u.email} (${u.role})`);
  }

  console.log('✨ Seed de robôs concluído!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
