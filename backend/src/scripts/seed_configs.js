const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const configs = [
    { key: "split_matriz", value: "40", label: "Split Matriz (%)" },
    { key: "split_captacao", value: "30", label: "Split Captação (%)" },
    { key: "split_edicao", value: "20", label: "Split Edição (%)" },
    { key: "split_cartorio", value: "10", label: "Split Cartório (%)" },
    { key: "mercado_pago_commission", value: "4.99", label: "Taxa Mercado Pago (%)" }
  ];

  console.log("=== SEEDING PLATFORM CONFIGS ===");

  for (const config of configs) {
    await prisma.platformConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, label: config.label },
      create: config
    });
    console.log(`[OK] Config: ${config.key} = ${config.value}%`);
  }

  console.log("=== SEED CONCLUÍDO ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
