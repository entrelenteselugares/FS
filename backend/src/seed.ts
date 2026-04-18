import "dotenv/config";
import prisma from "./lib/prisma";

async function main() {
  console.log("🌱 Iniciando Seed de Teste...");

  // 1. Criar Evento de Teste
  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 7); // Daqui a 7 dias (Pré-venda)

  const event = await prisma.event.create({
    data: {
      nomeNoivos: "Ana & João - Teste Premium",
      dataEvento: eventDate,
      cartorio: "Cartório Central de São Paulo",
      temFoto: true,
      temFotoImpressa: true,
    },
  });

  console.log(`✅ Evento criado: ${event.id}`);
  console.log(`\n🚀 URL para teste: http://localhost:5173/eventos/${event.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
