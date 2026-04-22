import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Script de Limpeza de Dados de Teste
 * Remove pedidos, eventos e logs de auditoria para preparar o ambiente real.
 */
async function main() {
  console.log("🧹 Iniciando limpeza de dados de teste...");

  try {
    // 1. Remover Itens de Repasse e Relatórios
    const d1 = await prisma.payoutItem.deleteMany();
    const d2 = await prisma.weeklyPayout.deleteMany();
    console.log(`- Repasses removidos: ${d1.count + d2.count}`);

    // 2. Remover Pedidos
    const d3 = await prisma.order.deleteMany();
    console.log(`- Pedidos (Vendas) removidos: ${d3.count}`);

    // 3. Remover Curtidas e Interações
    const d4 = await prisma.photoLike.deleteMany();
    console.log(`- Curtidas removidas: ${d4.count}`);

    // 4. Remover Eventos
    const d5 = await prisma.event.deleteMany();
    console.log(`- Eventos removidos: ${d5.count}`);

    // 5. Remover Logs de Auditoria
    const d6 = await prisma.auditLog.deleteMany();
    console.log(`- Logs de auditoria removidos: ${d6.count}`);

    // 6. Remover Usuários (Somente Role CLIENTE)
    const d7 = await prisma.user.deleteMany({
      where: { role: "CLIENTE" }
    });
    console.log(`- Clientes de teste removidos: ${d7.count}`);

    console.log("✅ Limpeza concluída. Sistema pronto para uso real.");
  } catch (error) {
    console.error("❌ Erro durante a limpeza:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
