
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  const senha = await bcrypt.hash('123456', 10);
  
  const roles = ['CLIENTE', 'PROFISSIONAL', 'CARTORIO'];
  
  for (const role of roles) {
    const email = `${role.toLowerCase()}@feijoada.com`;
    await prisma.user.upsert({
      where: { email },
      update: { senha, role: role as any },
      create: {
        email,
        senha,
        nome: `Test ${role}`,
        whatsapp: '5511999999999',
        role: role as any,
        isVerified: true
      }
    });
    console.log(`Created/Updated ${email} as ${role}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
