import { PrismaClient } from "@prisma/client";
import { PricingService } from "./services/pricing.service";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando Simulação de UAT Financeiro v3...");

  // 1. Setup Data
  let pro = await prisma.user.findFirst({ where: { role: "PROFISSIONAL" } });
  let cartorioUser = await prisma.user.findFirst({ where: { role: "CARTORIO" } });
  let franchiseeUser = await prisma.user.findFirst({ where: { role: "FRANCHISEE" } });
  
  const hash = await bcrypt.hash("123456", 10);

  if (!pro) {
      pro = await prisma.user.create({
          data: { email: "pro-test@uat.com", nome: "Pro UAT", role: "PROFISSIONAL", senha: hash }
      });
  }
  if (!cartorioUser) {
      cartorioUser = await prisma.user.create({
          data: { email: "cartorio-test@uat.com", nome: "Cartorio UAT", role: "CARTORIO", senha: hash }
      });
  }
  if (!franchiseeUser) {
      franchiseeUser = await prisma.user.create({
          data: { email: "franchisee-test@uat.com", nome: "Franchisee UAT", role: "FRANCHISEE", senha: hash }
      });
  }

  // 2. Setup Professional Network (Para testar comissão passiva)
  await prisma.professionalNetwork.upsert({
    where: { userId_partnerId: { userId: pro.id, partnerId: franchiseeUser.id } },
    update: {},
    create: { userId: pro.id, partnerId: franchiseeUser.id }
  });
  console.log(`✅ Rede Profissional vinculada: ${pro.email} -> ${franchiseeUser.email}`);

  // 3. Simular Cálculo de Split (Venda de R$ 1000)
  const amount = 1000;
  const splits = await PricingService.calculateSplits(amount, { 
    professionalId: pro.id 
  });

  console.log("\n--- SPLITS CALCULADOS (Digital) ---");
  console.log(`Valor Total: R$ ${amount}`);
  console.log(`Matriz: R$ ${splits.matriz}`);
  console.log(`Captação: R$ ${splits.captacao}`);
  console.log(`Edição: R$ ${splits.edicao}`);
  console.log(`Cartório: R$ ${splits.cartorio}`);
  console.log(`Franchisee (Passiva): R$ ${splits.franchisee}`);
  
  const totalCalculated = Number(splits.matriz) + Number(splits.captacao) + Number(splits.edicao) + Number(splits.cartorio) + Number(splits.franchisee);
  console.log(`Total Somado: R$ ${totalCalculated}`);
  
  if (Math.abs(totalCalculated - amount) > 0.01) {
    console.error("❌ ERRO: A soma dos splits não bate!");
  } else {
    console.log("✅ Soma dos splits validada.");
  }

  // 4. Testar Venda com Produto Físico (Custos de Fornecedor)
  console.log("\n--- SIMULANDO VENDA HÍBRIDA (Digital + Físico) ---");
  const shippingFee = 25;
  const supplierCost = 45;
  const hybridAmount = 200; // Total pago pelo cliente

  const hybridSplits = await PricingService.calculateSplits(hybridAmount, {
    professionalId: pro.id,
    shippingFee,
    supplierCost
  });

  console.log(`Valor Total Pago: R$ ${hybridAmount}`);
  console.log(`Custo Fornecedor: R$ ${supplierCost}`);
  console.log(`Frete: R$ ${shippingFee}`);
  console.log(`Líquido a Distribuir: R$ ${hybridAmount - shippingFee - supplierCost}`);
  console.log(`--- Splits ---`);
  console.log(`Matriz (Inclui Custos): R$ ${hybridSplits.matriz}`);
  console.log(`Captação: R$ ${hybridSplits.captacao}`);
  console.log(`Edição: R$ ${hybridSplits.edicao}`);
  console.log(`Cartório: R$ ${hybridSplits.cartorio}`);
  console.log(`Franchisee: R$ ${hybridSplits.franchisee}`);

  const hybridTotal = Number(hybridSplits.matriz) + Number(hybridSplits.captacao) + Number(hybridSplits.edicao) + Number(hybridSplits.cartorio) + Number(hybridSplits.franchisee);
  if (Math.abs(hybridTotal - hybridAmount) > 0.01) {
    console.error("❌ ERRO: Soma híbrida não bate!");
  } else {
    console.log("✅ Soma híbrida validada.");
  }

  console.log("\n🚀 Simulação concluída com sucesso.");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
