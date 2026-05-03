import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🛡️ INICIANDO OPERAÇÃO PENNY TESTING: REBASE DE PREÇOS PARA R$ 1,00");

  // 1. Atualizar Serviços no Catálogo
  const services = await prisma.serviceCatalog?.updateMany({
    data: {
      basePrice: "1.00"
    }
  });
  console.log(`✅ ${services?.count || 0} serviços atualizados para R$ 1,00.`);

  // 2. Atualizar Produtos
  const products = await prisma.printProduct?.updateMany({
    data: {
      sellingPrice: "1.00",
      supplierCost: "0.10" // Reduz o custo para evitar erros de margem se houver validação
    }
  });
  console.log(`✅ ${products?.count || 0} produtos atualizados para R$ 1,00.`);

  // 3. Atualizar Eventos Pendentes (Cotações que ainda não viraram pedidos)
  const events = await prisma.event.updateMany({
    where: { active: false },
    data: {
      priceBase: "1.00",
      priceEarly: "1.00"
    }
  });
  console.log(`✅ ${events.count} eventos pendentes atualizados para R$ 1,00.`);

  // 4. Atualizar Preços Customizados nos Cartórios (Parceiros)
  // Como o campo é JSON, precisamos buscar e atualizar um por um se houver.
  const cartorios = await prisma.cartorio.findMany();
  for (const c of cartorios) {
    if (c.servicePrices) {
      const prices = c.servicePrices as Record<string, any>;
      const newPrices: Record<string, string> = {};
      Object.keys(prices).forEach(key => {
        newPrices[key] = "1.00";
      });
      await prisma.cartorio.update({
        where: { id: c.id },
        data: { servicePrices: newPrices }
      });
    }
  }
  console.log(`✅ Preços customizados em ${cartorios.length} cartórios resetados.`);

  console.log("\n🚀 OPERAÇÃO CONCLUÍDA. O SISTEMA ESTÁ EM MODO DE TESTE DE CENTAVOS.");
}

main()
  .catch((e) => {
    console.error("❌ Erro no rebase:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
