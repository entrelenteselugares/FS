import prisma from '../lib/prisma';

async function main() {
  const email = 'entrelenteselugares@gmail.com';
  console.log(`Tentando promover o usuário: ${email}`);
  
  try {
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });
    console.log(`✅ SUCESSO! Usuário ${updatedUser.email} agora é ${updatedUser.role}.`);
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ ERRO: Usuário com e-mail ${email} não encontrado.`);
    } else {
      console.error('❌ ERRO inesperado:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
