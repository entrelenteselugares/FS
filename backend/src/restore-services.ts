
import prisma from "./lib/prisma";

const SERVICES_SEED = [
  { name: "Fotografia - Cobertura Solo", category: "FOTOGRAFIA", basePrice: 150.00, estimatedMinutes: 60, description: "1 Fotógrafo, equipamento profissional e entrega digital.", availableInVault: true },
  { name: "Fotografia - Cobertura Dupla", category: "FOTOGRAFIA", basePrice: 280.00, estimatedMinutes: 60, description: "2 Fotógrafos para eventos de médio porte.", availableInVault: true },
  { name: "Vídeo - Cobertura Solo", category: "VIDEO", basePrice: 180.00, estimatedMinutes: 60, description: "1 Cinegrafista, captação 4K e edição básica inclusa.", availableInVault: true },
  { name: "Vídeo - Reels Dinâmico", category: "VIDEO", basePrice: 120.00, estimatedMinutes: 30, description: "Captação vertical otimizada para redes sociais.", availableInVault: true },
  { name: "Edição - Tratamento de Cor", category: "EDICAO", basePrice: 50.00, estimatedMinutes: 60, description: "Tratamento profissional em lote via Lightroom.", availableInVault: true },
  { name: "Foto Point - Sessão Agendada", category: "FOTOGRAFIA", basePrice: 250.00, estimatedMinutes: 30, description: "Sessão expressa em local fixo (FOTO POINT).", availableInVault: true },
];

async function restoreServices() {
  console.log("Restaurando catálogo de serviços profissionais...");
  
  for (const s of SERVICES_SEED) {
    // Busca por nome manualmente
    const existing = await prisma.serviceCatalog.findFirst({ where: { name: s.name } });
    
    if (!existing) {
      await prisma.serviceCatalog.create({
        data: {
          ...s,
          active: true
        }
      });
      console.log(`+ Adicionado: ${s.name}`);
    } else {
      await prisma.serviceCatalog.update({
        where: { id: existing.id },
        data: {
          ...s,
          active: true
        }
      });
      console.log(`~ Atualizado: ${s.name}`);
    }
  }
  
  console.log(`✅ Processamento concluído.`);
}

restoreServices()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
