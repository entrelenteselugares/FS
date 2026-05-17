import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando backfill de referralCode para usuários legados...");
  
  const users = await prisma.user.findMany({
    where: {
      referralCode: null
    }
  });

  console.log(`Encontrados ${users.length} usuários sem referralCode.`);

  for (const user of users) {
    const newReferralCode = Array.from({length: 8}, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random()*36)]).join('');
    
    await prisma.user.update({
      where: { id: user.id },
      data: { referralCode: newReferralCode }
    });
    
    console.log(`Atualizado usuário ${user.email} com referralCode: ${newReferralCode}`);
  }

  console.log("Backfill concluído com sucesso.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
