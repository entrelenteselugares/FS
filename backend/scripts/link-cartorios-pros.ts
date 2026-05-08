import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Vinculando profissionais @dublin.com às Unidades Fixas recém-criadas...');

  const cartorios = await prisma.cartorio.findMany({
    where: { user: { email: { contains: 'unidade' } } }
  });

  const pros = await prisma.profissional.findMany({
    where: { user: { email: { endsWith: '@dublin.com' } } },
    take: 5
  });

  if (pros.length === 0) {
    console.log('Nenhum profissional @dublin.com encontrado para vincular!');
    return;
  }

  console.log(`Encontrados ${cartorios.length} cartórios e ${pros.length} profissionais.`);

  for (const cartorio of cartorios) {
    // Vincula o primeiro profissional disponível a este cartório
    await prisma.cartorioProfissional.create({
      data: {
        cartorioId: cartorio.id,
        profissionalId: pros[0].id,
        tipo: 'FIXO',
        status: 'ACCEPTED'
      }
    });
    console.log(`✅ Profissional vinculado ao cartório: ${cartorio.razaoSocial}`);
  }

  console.log('\n🚀 Sucesso! Todos os cartórios agora têm equipe e estão ativos na API.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
