import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Resetting password for unidade11@dublin.com...');
  const hash = await bcrypt.hash('123456', 10);
  await prisma.user.update({
    where: { email: 'unidade11@dublin.com' },
    data: { senha: hash }
  });
  console.log('✅ Password updated successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
