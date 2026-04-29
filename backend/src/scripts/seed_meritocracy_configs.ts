/**
 * Script de seed para configurações de Meritocracia.
 * Insere os valores padrão de Piso e Teto em EUR para o cálculo do Valor Hora.
 *
 * Executar com: npx ts-node src/scripts/seed_meritocracy_configs.ts
 */
import prisma from "../lib/prisma";

async function main() {
  console.log("\n🌱 Semeando configurações de Meritocracia...\n");

  const configs = [
    {
      key: "hourly_rate_floor_eur",
      value: "10",
      label: "Piso Mínimo Valor Hora (EUR)"
    },
    {
      key: "hourly_rate_ceiling_eur",
      value: "55",
      label: "Teto Máximo Valor Hora (EUR)"
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
    console.log(`✅ Configuração [${config.key}] semeada como: ${config.value} EUR`);
  }

  console.log("\n🎉 Configurações de Meritocracia prontas para uso!\n");
  await prisma.$disconnect();
}

main().catch(e => {
  console.error("[SEED ERROR]:", e);
  process.exit(1);
});
