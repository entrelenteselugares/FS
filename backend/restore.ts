import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const p = new PrismaClient();

async function r() {
  const h = await bcrypt.hash('123456', 10);
  await p.user.createMany({
    data: [
      { nome: 'Fotógrafo', email: 'fotografo@brasil.com.br', senha: h, role: Role.PROFESSIONAL },
      { nome: 'Unidade SP', email: 'unidade-sp@brasil.com.br', senha: h, role: Role.CARTORIO },
      { nome: 'Cliente VIP', email: 'cliente-vip@brasil.com.br', senha: h, role: Role.CLIENTE }
    ],
    skipDuplicates: true
  });
  console.log('Users created');
  await p.$disconnect();
}

r();
