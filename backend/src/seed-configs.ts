import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const configs = [
    { key: "split_matriz", value: "30", label: "Comissão Matriz (%)" },
    { key: "split_captacao", value: "40", label: "Repasse Captação (%)" },
    { key: "split_edicao", value: "10", label: "Repasse Edição (%)" },
    { key: "split_cartorio", value: "10", label: "Comissão Cartório (%)" },
    { key: "split_franchisee", value: "10", label: "Comissão Passiva B2B (%)" },
    { key: "split_affiliate_l1", value: "5", label: "Afiliado Direto — Nível 1 (%)" },
    { key: "split_affiliate_l2", value: "2", label: "Afiliado Passivo VIP — Nível 2 (%)" },
  ];

  for (const c of configs) {
    await prisma.platformConfig.upsert({
      where: { key: c.key },
      update: { value: c.value, label: c.label },
      create: { key: c.key, value: c.value, label: c.label }
    });
  }
  
  console.log("✅ Configurações de Split inicializadas.");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
