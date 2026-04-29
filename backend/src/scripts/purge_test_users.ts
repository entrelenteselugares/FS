/**
 * Script de limpeza de usuários de teste/legado.
 * Remove TODOS os dados associados aos usuários listados, na ordem correta de dependência.
 *
 * Executar com: npx ts-node src/scripts/purge_test_users.ts
 */
import prisma from "../lib/prisma";

// ─── USUÁRIOS ALVO ────────────────────────────────────────────────────────────
const TARGET_EMAILS = [
  "hojetemchocolatebr@gmail.com",
  "matheuskurio@gmail.com",
  "tlmagenciadigital@gmail.com",
  "tlimagenciadigital@gmail.com",
];

const TARGET_EVENT_KEYWORDS = ["EXEMPLO", "TESTE", "SILVA"];

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🧹 Iniciando limpeza de usuários de teste...\n");

  // 1. Busca os IDs dos usuários alvo
  const users = await prisma.user.findMany({
    where: { email: { in: TARGET_EMAILS } },
    select: { id: true, email: true, role: true },
  });

  if (users.length === 0) {
    console.log("ℹ️  Nenhum usuário alvo específico encontrado para deleção direta.");
  } else {
    console.log(`📋 Usuários encontrados (${users.length}):`);
    users.forEach(u => console.log(`   → ${u.email} | ${u.id} | ${u.role}`));
  }
  console.log("");


  const userIds = users.map(u => u.id);

  // ─── 2. DELETAR DADOS FILHOS (na ordem das dependências) ─────────────────

  // PhotoLikes
  const likes = await prisma.photoLike.deleteMany({ where: { userId: { in: userIds } } });
  console.log(`🗑️  PhotoLikes removidos: ${likes.count}`);

  // PrintRedemptions
  const redemptions = await prisma.printRedemption.deleteMany({ where: { userId: { in: userIds } } });
  console.log(`🗑️  PrintRedemptions removidos: ${redemptions.count}`);

  // UserPoints
  const points = await prisma.userPoints.deleteMany({ where: { userId: { in: userIds } } });
  console.log(`🗑️  UserPoints removidos: ${points.count}`);

  // ProfessionalNetwork (favoritos nos dois sentidos)
  const networks = await prisma.professionalNetwork.deleteMany({
    where: { OR: [{ userId: { in: userIds } }, { partnerId: { in: userIds } }] },
  });
  console.log(`🗑️  ProfessionalNetwork removidos: ${networks.count}`);

  // Orders onde o usuário é cliente
  const clientOrders = await prisma.order.findMany({
    where: { clienteId: { in: userIds } },
    select: { id: true },
  });
  const clientOrderIds = clientOrders.map(o => o.id);

  if (clientOrderIds.length > 0) {
    await prisma.orderItem.deleteMany({ where: { orderId: { in: clientOrderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: clientOrderIds } } });
    console.log(`🗑️  Orders (como cliente) removidos: ${clientOrderIds.length}`);
  }

  // Orders onde o usuário é editor
  const editorOrders = await prisma.order.findMany({
    where: { editorId: { in: userIds } },
    select: { id: true },
  });
  if (editorOrders.length > 0) {
    // Apenas desvincula — não deleta, pois o evento pode ter outros compradores
    await prisma.order.updateMany({
      where: { editorId: { in: userIds } },
      data: { editorId: null },
    });
    console.log(`🔗 Orders (como editor) desvinculados: ${editorOrders.length}`);
  }

  // Eventos onde o usuário é captacao/edicao (desvincula, não deleta o evento)
  const evCaptacao = await prisma.event.updateMany({
    where: { captacaoId: { in: userIds } },
    data: { captacaoId: null, captacaoStatus: "PENDING" },
  });
  console.log(`🔗 Eventos desvinculados (captação): ${evCaptacao.count}`);

  const evEdicao = await prisma.event.updateMany({
    where: { edicaoId: { in: userIds } },
    data: { edicaoId: null, edicaoStatus: "PENDING" },
  });
  console.log(`🔗 Eventos desvinculados (edição): ${evEdicao.count}`);

  // Eventos onde o usuário é cartorioUser (owner) — esses eventos pertencem ao usuário
  const ownedEvents = await prisma.event.findMany({
    where: { cartorioUserId: { in: userIds } },
    select: { id: true },
  });
  const ownedEventIds = ownedEvents.map(e => e.id);

  if (ownedEventIds.length > 0) {
    // Remove filhos dos eventos antes de remover os eventos
    await prisma.photoLike.deleteMany({ where: { eventId: { in: ownedEventIds } } });
    await prisma.eventMedia.deleteMany({ where: { eventId: { in: ownedEventIds } } });
    const orderItems = await prisma.order.findMany({
      where: { eventId: { in: ownedEventIds } },
      select: { id: true },
    });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: orderItems.map(o => o.id) } } });
    await prisma.order.deleteMany({ where: { eventId: { in: ownedEventIds } } });
    await prisma.event.deleteMany({ where: { id: { in: ownedEventIds } } });
    console.log(`🗑️  Eventos próprios removidos (com orders/media): ${ownedEventIds.length}`);
  }

  // Profissional profile
  const profissionais = await prisma.profissional.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const profIds = profissionais.map(p => p.id);

  if (profIds.length > 0) {
    await prisma.cartorioProfissional.deleteMany({ where: { profissionalId: { in: profIds } } });
    await prisma.professionalService.deleteMany({ where: { profissionalId: { in: profIds } } });
    await prisma.profissional.deleteMany({ where: { id: { in: profIds } } });
    console.log(`🗑️  Perfis Profissional removidos: ${profIds.length}`);
  }

  // Cartorio profile
  const cartorios = await prisma.cartorio.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const cartorioIds = cartorios.map(c => c.id);

  if (cartorioIds.length > 0) {
    await prisma.cartorioProfissional.deleteMany({ where: { cartorioId: { in: cartorioIds } } });
    await prisma.cartorio.deleteMany({ where: { id: { in: cartorioIds } } });
    console.log(`🗑️  Perfis Cartório removidos: ${cartorioIds.length}`);
  }

  // ─── 3. LIMPEZA TOTAL DE EVENTOS E PEDIDOS (RESET PARA TESTE) ───────────
  console.log("🧹 Realizando limpeza total de eventos e pedidos para novos testes...");
  
  await prisma.photoLike.deleteMany({});
  await prisma.eventMedia.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.printRedemption.deleteMany({});
  await prisma.event.deleteMany({});
  
  console.log("🗑️  Todos os eventos, pedidos e mídias foram removidos.");

  // ─── 4. LIMPEZA DE PERFIS ÓRFÃOS (CASO O USUÁRIO JÁ TENHA SIDO APAGADO) ─
  console.log("🔍 Procurando por perfis profissionais ou cartórios órfãos...");
  
  const allUsers = await prisma.user.findMany({ select: { id: true } });
  const allUserIds = allUsers.map(u => u.id);

  const orphanProfs = await prisma.profissional.findMany({
    where: { userId: { notIn: allUserIds } }
  });
  if (orphanProfs.length > 0) {
    const ids = orphanProfs.map(p => p.id);
    await prisma.cartorioProfissional.deleteMany({ where: { profissionalId: { in: ids } } });
    await prisma.professionalService.deleteMany({ where: { profissionalId: { in: ids } } });
    await prisma.profissional.deleteMany({ where: { id: { in: ids } } });
    console.log(`🗑️  Perfis Profissionais órfãos removidos: ${orphanProfs.length}`);
  }

  const orphanCartorios = await prisma.cartorio.findMany({
    where: { userId: { notIn: allUserIds } }
  });
  if (orphanCartorios.length > 0) {
    const ids = orphanCartorios.map(c => c.id);
    await prisma.cartorioProfissional.deleteMany({ where: { cartorioId: { in: ids } } });
    await prisma.cartorio.deleteMany({ where: { id: { in: ids } } });
    console.log(`🗑️  Perfis Cartórios órfãos removidos: ${orphanCartorios.length}`);
  }


  // ─── 5. DELETAR OS USUÁRIOS ALVO (REMANESCENTES) ─────────────────────────



  const deleted = await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  console.log(`\n✅ Usuários removidos: ${deleted.count}`);
  console.log("\n🎉 Limpeza concluída com sucesso! Banco de dados normalizado.\n");

  await prisma.$disconnect();
}

main().catch(e => {
  console.error("\n[PURGE ERROR]:", e);
  process.exit(1);
});
