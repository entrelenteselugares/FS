import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Padrão Singleton com Driver Adapter (Prisma 6)
 * Elimina a dependência de motores Rust (binários) em produção.
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL;

function createPrismaClient() {
  if (!connectionString) {
    console.error("❌ ERRO CRÍTICO: DATABASE_URL não configurada no ambiente!");
    // Retorna um cliente "vazio" para não travar o boot. Erros ocorrerão apenas nas queries.
    return new PrismaClient();
  }

  // Cria a pool de conexões nativa do Postgres (node-postgres)
  const pool = new Pool({ 
    connectionString,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
  });
  
  // Envolve a pool com o adaptador do Prisma
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
