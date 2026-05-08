import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando injeção de 15 Unidades Fixas (Pontos Fixos) @dublin.com...');

  const unidadesNomes = [
    'Unidade Matriz - Dublin Center',
    'Dublin Prime - Zona Sul',
    'Dublin Express - Aeroporto',
    'Ponto Fixo - Shopping Boulevard',
    'Cartório Fotográfico - Dublin Norte',
    'Unidade VIP - Beira Mar',
    'Dublin Station - Metrô Central',
    'Ponto de Coleta - Dublin Resort',
    'Unidade Cultural - Museu Histórico',
    'Dublin Premium - Bairro Jardins',
    'Unidade Fixa - Centro de Convenções',
    'Ponto Turístico - Dublin Eye',
    'Dublin Corporate - Empresarial Park',
    'Unidade Universitária - Campus Sul',
    'Dublin Studio - Avenida Paulista'
  ];

  for (let i = 0; i < 15; i++) {
    const email = `unidade${i + 1}@dublin.com`;
    const nome = unidadesNomes[i];

    // 1. Cria o usuário com a role CARTORIO (Unidade Fixa)
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        nome,
        senha: '123456_dublin',
        role: 'CARTORIO',
      }
    });

    // 2. Vincula o perfil da Unidade Fixa
    await prisma.cartorio.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        razaoSocial: nome,
        cidade: 'Dublin',
        coverUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800',
        phone: `+55 11 99999-00${i.toString().padStart(2, '0')}`
      }
    });

    console.log(`✅ Unidade Fixa criada: ${nome} (${email})`);
  }

  console.log('\n🚀 Sucesso! 15 Unidades Fixas foram injetadas no banco de dados e estão prontas para cotação.');
}

main()
  .catch(e => {
    console.error('Erro ao semear unidades:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
