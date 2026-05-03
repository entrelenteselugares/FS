import prisma from "../lib/prisma";

async function main() {
  console.log("\n🌱 Semeando configurações de Split de Franquia...\n");

  const configs = [
    {
      key: "split_franchisee",
      value: "5",
      label: "Comissão Passiva de Franquia (%)"
    }
  ];

  for (const config of configs) {
    await prisma.platformConfig.upsert({
      where: { key: config.key },
      update: {},
      create: {
        key: config.key,
        value: config.value,
        label: config.label
      }
    });
    console.log(`✅ Configuração [${config.key}] semeada como: ${config.value}%`);
  }

  console.log("\n🎉 Configurações de Franquia prontas!\n");
  await prisma.$disconnect();
}

main().catch(e => {
  console.error("[SEED ERROR]:", e);
  process.exit(1);
});
