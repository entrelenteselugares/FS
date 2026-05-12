import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando Seed de Configurações...");
  
  const configs = [
    { key: "split_matriz",   value: "40", label: "% Plataforma (Foto Segundo)" },
    { key: "split_captacao", value: "30", label: "% Fotógrafo/Captação" },
    { key: "split_edicao",   value: "20", label: "% Editor" },
    { key: "split_cartorio", value: "10", label: "% Cartório parceiro" },
    { key: "payout_day",     value: "1",  label: "Dia do repasse (1=Segunda)" },
    { key: "pix_matriz",     value: "contatofotosegundo@gmail.com", label: "Chave Pix da plataforma" },
  ];

  for (const c of configs) {
    await prisma.platformConfig.upsert({
      where: { key: c.key },
      create: c,
      update: { 
        value: c.value, 
        label: c.label 
      },
    });
    console.log(`✅ Configuração: ${c.key} = ${c.value}`);
  }

  console.log("✨ Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro no Seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
