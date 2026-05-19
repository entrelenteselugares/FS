import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando o Seed de Serviços de Teste e Configurações Financeiras...");

  // 1. ATUALIZAÇÃO DOS PERCENTUAIS DE SPLIT (OBJETIVO FINANCEIRO DO FUNDADOR)
  // Matriz (Plataforma): 45% -> Custeio de infra, contratação de Dev Senior e salário do Founder.
  // Captação (Fotógrafo): 30% -> Altamente atrativo para o trabalho de campo.
  // Edição (Editor): 15% -> Justo para pós-processamento digital.
  // Cartório/Parceiro: 10% -> Parceria passiva de indicação.
  const configs = [
    { key: "split_matriz",   value: "45", label: "% Plataforma (Foto Segundo - Dev Senior + Founder + Custos)" },
    { key: "split_captacao", value: "30", label: "% Fotógrafo/Captação (Trabalho de Campo)" },
    { key: "split_edicao",   value: "15", label: "% Editor (Tratamento e Seleção)" },
    { key: "split_cartorio", value: "10", label: "% Cartório parceiro (Indicação)" },
    { key: "payout_day",     value: "1",  label: "Dia do repasse (1=Segunda)" },
    { key: "pix_matriz",     value: "contatofotosegundo@gmail.com", label: "Chave Pix da plataforma" },
  ];

  console.log("\n⚙️ Atualizando configurações de splits financeiros...");
  for (const c of configs) {
    await prisma.platformConfig.upsert({
      where: { key: c.key },
      create: c,
      update: { 
        value: c.value, 
        label: c.label 
      },
    });
    console.log(`✅ Configuração: ${c.key} = ${c.value}%`);
  }

  // 2. CADASTRO DE SERVIÇOS NO CATÁLOGO (PREÇOS DE TESTE REAL: R$ 0,05 A R$ 0,99)
  const testServices = [
    // FOTOGRAFIA
    {
      name: "Fotógrafo Principal (por hora)",
      description: "Contratação de Fotógrafo Principal para cobertura geral do evento.",
      basePrice: 0.15,
      priceProfessional: 0.05,
      priceMobile: 0.02,
      allowProfessional: true,
      allowMobile: true,
      category: "FOTOGRAFIA",
      estimatedMinutes: 60,
    },
    {
      name: "Cobertura Casamento Civil",
      description: "Cobertura fotográfica especializada para casamentos em cartório parceiro.",
      basePrice: 0.35,
      priceProfessional: 0.10,
      priceMobile: 0.05,
      allowProfessional: true,
      allowMobile: true,
      category: "FOTOGRAFIA",
      estimatedMinutes: 60,
    },
    {
      name: "Cobertura de Evento Esportivo (Atleta)",
      description: "Cobertura fotográfica por participante em provas esportivas e corridas de rua.",
      basePrice: 0.10,
      priceProfessional: 0.03,
      priceMobile: 0.01,
      allowProfessional: true,
      allowMobile: true,
      category: "FOTOGRAFIA",
      estimatedMinutes: 30,
    },
    {
      name: "Formatura Escolar (Formando)",
      description: "Cobertura individual de formando durante colação de grau ou festa escolar.",
      basePrice: 0.25,
      priceProfessional: 0.08,
      priceMobile: 0.03,
      allowProfessional: true,
      allowMobile: true,
      category: "FOTOGRAFIA",
      estimatedMinutes: 60,
    },
    {
      name: "Cobertura Completa: Cerimônia + Recepção",
      description: "Cobertura fotográfica completa incluindo cerimônia e recepção social.",
      basePrice: 0.99,
      priceProfessional: 0.30,
      priceMobile: 0.10,
      allowProfessional: true,
      allowMobile: true,
      category: "FOTOGRAFIA",
      estimatedMinutes: 360,
    },

    // VÍDEO
    {
      name: "Gravação e Edição de Reels",
      description: "Gravação dinâmica focada em formatos verticais rápidos para redes sociais.",
      basePrice: 0.20,
      priceProfessional: 0.06,
      priceMobile: 0.02,
      allowProfessional: true,
      allowMobile: true,
      category: "VIDEO",
      estimatedMinutes: 60,
    },
    {
      name: "Vídeo Teaser (Melhores Momentos)",
      description: "Edição cinematográfica curta (1 a 2 min) contendo os destaques do evento.",
      basePrice: 0.50,
      priceProfessional: 0.15,
      priceMobile: 0.05,
      allowProfessional: true,
      allowMobile: true,
      category: "VIDEO",
      estimatedMinutes: 120,
    },
    {
      name: "Filmagem Cinematográfica Completa",
      description: "Filmagem completa com entrega em alta definição e mixagem de áudio dos votos.",
      basePrice: 0.95,
      priceProfessional: 0.28,
      priceMobile: 0.08,
      allowProfessional: true,
      allowMobile: true,
      category: "VIDEO",
      estimatedMinutes: 240,
    },

    // EDIÇÃO
    {
      name: "Tratamento de Lote (100 Fotos)",
      description: "Curadoria, balanço cromático e exportação premium para lotes de fotos.",
      basePrice: 0.30,
      priceProfessional: 0.10,
      priceMobile: 0.03,
      allowProfessional: true,
      allowMobile: true,
      category: "EDICAO",
      estimatedMinutes: 90,
    },
    {
      name: "Retoque Premium / Manipulação",
      description: "Retoque de pele avançado e remoção de imperfeições em fotos individuais.",
      basePrice: 0.05,
      priceProfessional: 0.02,
      priceMobile: 0.01,
      allowProfessional: true,
      allowMobile: true,
      category: "EDICAO",
      estimatedMinutes: 15,
    },

    // PÓS-EDIÇÃO
    {
      name: "Diagramação de Álbum Editorial",
      description: "Criação de narrativa e posicionamento estético de fotos em páginas do álbum físico.",
      basePrice: 0.40,
      priceProfessional: 0.12,
      priceMobile: 0.04,
      allowProfessional: true,
      allowMobile: true,
      category: "POS_EDICAO",
      estimatedMinutes: 120,
    },
    {
      name: "Edição Expressa de Vídeo (48h)",
      description: "Processamento e corte prioritário para entrega ágil do vídeo editado em 48 horas.",
      basePrice: 0.50,
      priceProfessional: 0.15,
      priceMobile: 0.05,
      allowProfessional: true,
      allowMobile: true,
      category: "POS_EDICAO",
      estimatedMinutes: 60,
    },

    // PRÉ-EVENTO
    {
      name: "Ensaio Pré-Wedding",
      description: "Sessão fotográfica romântica externa realizada antes da cerimônia do casamento.",
      basePrice: 0.45,
      priceProfessional: 0.15,
      priceMobile: 0.05,
      allowProfessional: true,
      allowMobile: true,
      category: "PRE_EVENTO",
      estimatedMinutes: 120,
    },
    {
      name: "Ensaio Save The Date",
      description: "Sessão fotográfica rápida ou ensaio corporativo focado em retratos profissionais.",
      basePrice: 0.30,
      priceProfessional: 0.10,
      priceMobile: 0.03,
      allowProfessional: true,
      allowMobile: true,
      category: "PRE_EVENTO",
      estimatedMinutes: 60,
    },

    // LOCAÇÃO
    {
      name: "Aluguel de Estúdio Fotográfico",
      description: "Reserva de espaço climatizado com fundo infinito e conjunto básico de tochas de luz.",
      basePrice: 0.25,
      priceProfessional: 0.08,
      priceMobile: 0.03,
      allowProfessional: true,
      allowMobile: true,
      category: "LOCACAO",
      estimatedMinutes: 60,
    },
    {
      name: "Aluguel de Kit de Iluminação Externa",
      description: "Tripés, flashes speedlight e rebatedores para ensaios externos complexos.",
      basePrice: 0.20,
      priceProfessional: 0.06,
      priceMobile: 0.02,
      allowProfessional: true,
      allowMobile: true,
      category: "LOCACAO",
      estimatedMinutes: 60,
    },

    // EXTRAS
    {
      name: "Hora Extra de Cobertura",
      description: "Adicional por hora extra excedente ao tempo de cobertura contratado do evento.",
      basePrice: 0.15,
      priceProfessional: 0.05,
      priceMobile: 0.02,
      allowProfessional: true,
      allowMobile: true,
      category: "EXTRAS",
      estimatedMinutes: 60,
    },
    {
      name: "Entrega Digital Expressa (24h)",
      description: "Taxa para processamento prioritário e liberação das fotos na nuvem em até 24 horas.",
      basePrice: 0.12,
      priceProfessional: 0.04,
      priceMobile: 0.01,
      allowProfessional: true,
      allowMobile: true,
      category: "EXTRAS",
      estimatedMinutes: 10,
    },
    {
      name: "Phygital Print (Foto revelada na hora)",
      description: "Revelação fotográfica térmica instantânea entregue em paspartu no próprio evento.",
      basePrice: 0.05,
      priceProfessional: 0.02,
      priceMobile: 0.01,
      allowProfessional: true,
      allowMobile: true,
      category: "EXTRAS",
      estimatedMinutes: 5,
    },
  ];

  console.log("\n🧹 Limpando catálogo de serviços existente...");
  await prisma.serviceCatalog.deleteMany({});
  console.log("✅ Limpeza concluída!");

  console.log("\n📦 Cadastrando serviços de teste de transação...");
  for (const s of testServices) {
    await prisma.serviceCatalog.create({
      data: s,
    });
    console.log(`🔹 Serviço Cadastrado: [${s.category}] ${s.name} - R$ ${s.basePrice}`);
  }

  console.log("\n✨ Seed de serviços e splits finalizado com absoluto sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao rodar Seed de Serviços:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
