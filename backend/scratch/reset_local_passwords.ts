import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPasswords() {
  console.log('🔐 RESETANDO SENHAS LOCAIS (FAIL-SAFE)...');
  
  const hash = await bcrypt.hash('123456', 12);
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { senha: hash }
    });
    console.log(`- Senha local resetada para: ${user.email}`);
  }
  
  console.log('\n✅ TODAS AS SENHAS LOCAIS SÃO AGORA "123456"');
}

resetPasswords().finally(() => prisma.$disconnect());
