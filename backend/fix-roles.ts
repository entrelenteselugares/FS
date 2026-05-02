import prisma from './src/lib/prisma';

async function fix() {
  const updated = await prisma.user.updateMany({
    where: { role: 'FRANCHISEE' },
    data: { role: 'PROFISSIONAL' }
  });
  console.log(`✅ Corrigido: ${updated.count} usuário(s) voltaram para PROFISSIONAL`);
  await prisma.$disconnect();
}

fix().catch(console.error);
