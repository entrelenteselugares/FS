import prisma from './src/lib/prisma';

async function check() {
  // Lista todos os usuários com FranchiseProfile
  const profiles = await prisma.franchiseProfile.findMany({
    include: { user: { select: { email: true, nome: true, role: true } } }
  });
  console.log('FranchiseProfiles existentes:', JSON.stringify(profiles, null, 2));

  // Lista usuários que eram PROFISSIONAL mas não têm FranchiseProfile
  const profissionais = await prisma.user.findMany({
    where: { role: 'PROFISSIONAL', franchiseProfile: null },
    select: { id: true, email: true, nome: true }
  });
  console.log('\nProfissionais SEM FranchiseProfile:', profissionais.map(u => u.email));
  
  await prisma.$disconnect();
}

check().catch(console.error);
