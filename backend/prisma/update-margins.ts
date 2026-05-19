import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando o recalculo de margens de lucro para Central de Impressão...");

  // 1. CARREGAR TODOS OS PRODUTOS DO FORNECEDOR CK
  const products = await prisma.printProduct.findMany({
    where: {
      supplier: "CK",
    },
  });

  if (products.length === 0) {
    console.log("⚠️ Nenhum produto encontrado para o fornecedor CK.");
    return;
  }

  console.log(`📦 Encontrados ${products.length} produtos. Atualizando margem para 50%...`);

  // 2. ATUALIZAR CADA PRODUTO COM MARGEM DE 50% E PREÇO RECALCULADO
  for (const p of products) {
    const cost = Number(p.supplierCost);
    const newMargin = 50;
    const newPrice = cost * 1.50; // 50% de lucro (markup de 50%)

    await prisma.printProduct.update({
      where: { id: p.id },
      data: {
        marginPct: newMargin,
        sellingPrice: newPrice,
      },
    });

    console.log(`✅ Atualizado [${p.sku}] ${p.name}: Custo R$ ${cost.toFixed(2)} -> Margem 50% -> Venda R$ ${newPrice.toFixed(2)}`);
  }

  console.log("\n✨ Todas as margens e preços de venda da Central CK foram atualizados com 50% de lucro!");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao atualizar margens de impressão:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
