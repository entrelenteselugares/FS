const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.serviceCatalog.createMany({
    data: [
      { name: "Ensaio Express (30 min)", description: "Cobertura fotográfica rápida em locação.", basePrice: 200.0, estimatedMinutes: 30 },
      { name: "Casamento Civil (2h)", description: "Cobertura do cartório com breve ensaio dos noivos.", basePrice: 400.0, estimatedMinutes: 120 },
      { name: "Evento Social/Festa (4h)", description: "Cobertura de festas, aniversários ou eventos corporativos.", basePrice: 600.0, estimatedMinutes: 240 }
    ],
    skipDuplicates: true
  });
  console.log("Catálogo Global Populado com Sucesso!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
