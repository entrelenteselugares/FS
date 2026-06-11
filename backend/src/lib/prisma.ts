import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

/**
 * Singleton de Prisma para ambientes Serverless (Vercel + Supabase PgBouncer).
 *
 * Regras de conexão:
 * - max: 2   — Uma Lambda é single-threaded. Max 2 permite uma query principal
 *              + uma query aninhada (ex: audit log), sem desperdiçar slots do PgBouncer.
 * - idleTimeoutMillis: 10_000 — Devolve conexão ociosa ao PgBouncer após 10s.
 *              Crítico em serverless onde instâncias ficam "warm" sem tráfego.
 * - connectionTimeoutMillis: 5_000 — Falha rápido se PgBouncer estiver saturado.
 *              Evita que a Lambda fique pendurada 60s até timeout da Vercel.
 *
 * PgBouncer (Supabase):
 * - O parâmetro ?pgbouncer=true na URL desativa prepared statements no Prisma,
 *   necessário em modo transaction. NÃO remover.
 * - O pool real de conexões é gerenciado pelo PgBouncer no Supabase (padrão: 15).
 *   Cada Lambda abre no máximo 2 conexões físicas com o PgBouncer.
 */

// Tipagem explícita para o singleton global (sobrevive a hot reload em dev)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const log =
    process.env.NODE_ENV === "development"
      ? (["query", "error", "warn"] as const)
      : (["error"] as const);

  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl) {
    // Pool configurado para ambientes serverless — NÃO alterar os limites sem medir impacto
    const pool = new Pool({
      connectionString: dbUrl,
      max: 2,                        // Máximo de conexões simultâneas por Lambda
      min: 0,                        // Não mantém conexões ociosas obrigatórias
      idleTimeoutMillis: 10_000,     // Fecha conexão ociosa após 10s
      connectionTimeoutMillis: 5_000, // Falha rápido se pool estiver esgotado
    });

    // Log de erros do pool de conexões (falhas de autenticação, rede, etc.)
    pool.on("error", (err) => {
      console.error("[PrismaPool] Erro inesperado no pool de pg:", err.message);
    });

    const adapter = new PrismaPg(pool);
     
    return new PrismaClient({ adapter, log: [...log] } as any);
  }

  // Fallback sem adapter (conexão direta, ex: migrations locais sem PgBouncer)
  return new PrismaClient({ log: [...log] });
}

// O global garante um único cliente por processo Node.js.
// Em dev, o hot reload cria novos módulos — o global reutiliza o cliente existente.
// Em produção (Vercel), o cache de módulos já garante o singleton, mas mantemos
// o global como segunda camada de segurança.
export const prisma =
  globalForPrisma.prisma ?? (globalForPrisma.prisma = createPrismaClient());

export default prisma;
