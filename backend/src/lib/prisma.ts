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
    console.error("❌ AVISO: DATABASE_URL não configurada. Queries ao BD falharão.");
    return new PrismaClient();
  }

  try {
    const pool = new Pool({ 
      connectionString,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
    });
    
    const adapter = new PrismaPg(pool);

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  } catch (err) {
    console.error("❌ Falha ao inicializar Prisma Client:", err);
    return new PrismaClient();
  }
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
