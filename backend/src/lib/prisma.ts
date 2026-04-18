import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * Cria uma instância padrão do Prisma Client.
 * O Prisma 6+ já lida muito bem com serverless se a URL estiver correta.
 */
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("[CRITICAL] DATABASE_URL não encontrada!");
    return null as any; 
  }

  try {
    console.log("[DB] Inicializando Prisma Client Nativo...");
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  } catch (err) {
    console.error("[DB BOOTSTRAP ERROR]:", err);
    return null as any;
  }
}

export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    
    if (!globalForPrisma.prisma) {
      throw new Error("DATABASE_URL_NOT_CONFIGURED: Verifique as variáveis no Vercel.");
    }
    
    return (globalForPrisma.prisma as any)[prop];
  }
});

export default prisma;
