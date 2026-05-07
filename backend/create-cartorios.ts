import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('123456', 10);
  const units = [
    { nome: 'BR Unidade SP', email: 'unidade-sp@brasil.com.br', role: Role.CARTORIO },
    { nome: 'BR Unidade RJ', email: 'unidade-rj@brasil.com.br', role: Role.CARTORIO },
    { nome: 'BR Unidade MG', email: 'unidade-mg@brasil.com.br', role: Role.CARTORIO }
  ];

  for (const u of units) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, senha: hash },
      create: {
        nome: u.nome,
        email: u.email,
        senha: hash,
        role: u.role,
      }
    });
    console.log(`Created/Updated: ${u.email}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
