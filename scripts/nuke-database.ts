import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("☢️  INICIANDO LIMPEZA NUCLEAR DO SISTEMA...");

  const tables = [
    "audit_logs",
    "credit_transactions",
    "phygital_prints",
    "order_items",
    "orders",
    "photo_likes",
    "event_media",
    "calendar_slots",
    "events",
    "franchise_profiles",
    "professional_services",
    "cartorio_profissionais",
    "profissionais",
    "cartorios",
    "quotes",
    "user_points",
    "user_calendar_credentials",
    "professional_networks",
    "gamification_ledger",
    "users"
  ];

  try {
    for (const table of tables) {
      console.log(`🧹 Limpando tabela: ${table}...`);
      // CASCADE garante que as Fks não travem a deleção
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
    }

    console.log("✅ SISTEMA LIMPO COM SUCESSO!");
  } catch (error) {
    console.error("❌ ERRO DURANTE A LIMPEZA:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
