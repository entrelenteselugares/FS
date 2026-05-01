import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USERS_TO_DELETE = [
  "contatofotosegundo@gmail.com",
  "entrelenteselugares@gmail.com",
  "matheuskurio@gmail.com",
  "moraesrenata.br@gmail.com",
  "recomendoacacidade@gmail.com"
];

async function main() {
  console.log("🚀 Iniciando limpeza profunda do banco de dados para produção...");

  // 1. Logs e Repasses (Dados transacionais voláteis)
  console.log("🗑️ Deletando Auditoria e Repasses...");
  await prisma.auditLog.deleteMany({});
  await prisma.payoutItem.deleteMany({});
  await prisma.weeklyPayout.deleteMany({});

  // 2. Pedidos e Itens (Fluxo de venda)
  console.log("🗑️ Deletando Pedidos e Itens...");
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});

  // 3. Eventos e Mídias (Conteúdo)
  console.log("🗑️ Deletando Eventos e Mídias...");
  await prisma.eventMedia.deleteMany({});
  await prisma.photoLike.deleteMany({});
  await prisma.event.deleteMany({});

  // 4. Gamificação e Redenções
  console.log("🗑️ Deletando Pontos e Resgates...");
  await prisma.printRedemption.deleteMany({});
  await prisma.userPoints.deleteMany({});

  // 5. Orçamentos (Leads de teste)
  console.log("🗑️ Deletando Orçamentos (Leads)...");
  await prisma.quote.deleteMany({});

  // 6. Estruturas de Perfil (Profissionais e Cartórios)
  // Nota: Deletamos as relações primeiro para evitar erros de FK se não houver cascade total
  console.log("🗑️ Deletando Vínculos de Unidades e Serviços...");
  await prisma.cartorioProfissional.deleteMany({});
  await prisma.professionalService.deleteMany({});
  await prisma.professionalNetwork.deleteMany({});
  
  console.log("🗑️ Deletando Perfis de Profissionais e Cartórios...");
  await prisma.profissional.deleteMany({});
  await prisma.cartorio.deleteMany({});

  // 7. Usuários Específicos (Conforme solicitado pelo usuário)
  console.log(`🗑️ Deletando usuários solicitados: ${USERS_TO_DELETE.join(", ")}`);
  const deleteResult = await prisma.user.deleteMany({
    where: {
      email: { in: USERS_TO_DELETE.map(e => e.toLowerCase().trim()) }
    }
  });
  console.log(`✅ ${deleteResult.count} usuários removidos.`);

  // 8. Opcional: Manter o catálogo global e configurações de plataforma intactos 
  // pois são dados estruturais necessários para o funcionamento.

  console.log("\n✨ BANCO DE DADOS LIMPO E PRONTO PARA USO REAL.");
}

main()
  .catch(e => {
    console.error("❌ Erro durante a limpeza:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
