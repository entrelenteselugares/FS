import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupGuestArtifacts() {
  console.log("🧹 Iniciando limpeza de artefatos de teste (Penny Testing / Guests)...");

  try {
    // 1. Limpar Pedidos Guest
    const deletedOrders = await prisma.order.deleteMany({
      where: {
        OR: [
          { buyerEmail: { contains: "guest" } },
          { buyerEmail: { contains: "contatofotosegundo+test" } },
          { isGuestOrder: true, status: "PENDENTE" }
        ]
      }
    });
    console.log(`✅ ${deletedOrders.count} Pedidos (Orders) removidos.`);

    // 2. Limpar Entidades Phygital de Teste
    const deletedPrints = await prisma.phygitalPrint.deleteMany({
      where: {
        OR: [
          { customerName: { contains: "Penny Tester" } },
          { customerName: { contains: "Simulado" } }
        ]
      }
    });
    console.log(`✅ ${deletedPrints.count} Phygital Prints simulados removidos.`);

    // 3. Opcional: Limpar Usuários de Teste criados (se a lógica chegou a criar conta)
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: { contains: "contatofotosegundo+test" }
      }
    });
    console.log(`✅ ${deletedUsers.count} Usuários (Users) de teste removidos.`);

    console.log("🚀 Limpeza concluída com sucesso! Ambiente pronto para Fase 10.");

  } catch (error) {
    console.error("❌ Erro ao limpar artefatos:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupGuestArtifacts();
