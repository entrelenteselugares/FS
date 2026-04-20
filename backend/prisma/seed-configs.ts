import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const configs = [
    { key: "split_matriz",    value: "40", label: "% Plataforma (Foto Segundo)" },
    { key: "split_captacao",  value: "30", label: "% Fotógrafo/Captação" },
    { key: "split_edicao",    value: "20", label: "% Editor" },
    { key: "split_cartorio",  value: "10", label: "% Cartório parceiro" },
    { key: "payout_day",      value: "1",  label: "Dia do repasse (1=Segunda, 5=Sexta)" },
    { key: "payout_cutoff",   value: "0",  label: "Dias de corte antes do repasse" },
    { key: "pix_matriz",      value: "",   label: "Chave Pix da plataforma" },
  ];

  for (const config of configs) {
    await prisma.platformConfig.upsert({
      where: { key: config.key },
      create: config,
      update: { value: config.value, label: config.label },
    });
  }

  console.log("✅ Configurações criadas.");
}

main().finally(() => prisma.$disconnect());
