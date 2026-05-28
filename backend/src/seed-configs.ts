import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const configs = [
    { key: "markup_cliente", value: "20", label: "Markup Cliente (Preço Final) %" },
    { key: "take_rate_profissional", value: "7", label: "Taxa de Intermediação Profissional (Take Rate) %" },
    { key: "split_affiliate", value: "2", label: "Taxa de Afiliado (%)" },
    { key: "split_taxes", value: "6", label: "Impostos (%)" },
    { key: "split_platform_costs", value: "5", label: "Custos da Plataforma (%)" }
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
