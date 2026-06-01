import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";
import cookieParser from "cookie-parser";
import routes from "./routes/index";
import { initSentry } from "./lib/sentry";
import * as Sentry from "@sentry/node";

initSentry();

const app = express();

// ── ROTA DE SAÚDE ULTRA-PRECOCE (Blindada) ───────────────────────────
import { prisma } from "./lib/prisma";

// ── ROTA DE SAÚDE AVANÇADA (Monitoramento de Produção) ───────────────────────────
app.get("/api/health", async (_req, res) => {
  let dbStatus = "unknown";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (err) {
    dbStatus = "disconnected";
    console.error("[HEALTH CHECK] Database error:", err);
  }

  res.json({ 
    status: dbStatus === "connected" ? "ok" : "degraded", 
    database: dbStatus,
    boot: true, 
    version: "v2.1.0-golden-stable",
    time: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});

// ── VALIDAÇÃO DE AMBIENTE ───────────────────────────
const REQUIRED_ENVS = ["JWT_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "FRONTEND_URL", "APP_URL", "DATABASE_URL"];
REQUIRED_ENVS.forEach(env => {
  if (!process.env[env]) {
    console.error(`❌ AVISO CRÍTICO: Variável de ambiente ${env} não configurada no ambiente de produção.`);
  }
});

if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL) {
  if (!process.env.DATABASE_URL.includes("6543") && !process.env.DATABASE_URL.includes("pgbouncer=true")) {
    console.warn("⚠️ AVISO CRÍTICO: DATABASE_URL de produção não parece apontar para um Connection Pooler (ex: porta 6543 do Supabase). Risco de Database Connection Exhaustion no Vercel.");
  }
}

// Aviso não-fatal para variáveis opcionais importantes
if (!process.env.MASTER_EMAIL) {
  console.warn("⚠️  MASTER_EMAIL não configurada — Master Bypass desativado.");
}

// CRÍTICO: necessário para rate-limit funcionar na Vercel
app.set("trust proxy", 1);

// ── MIDDLEWARES DE SEGURANÇA & PARSERS ───────────────────────────────────────
app.use(cookieParser());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || 
        origin.startsWith("http://localhost:") || 
        origin.startsWith("http://127.0.0.1:") ||
        origin === "https://foto-segundo.vercel.app" ||
        origin === "https://fs-backend-beige.vercel.app" ||
        /^https:\/\/foto-segundo-[a-z0-9]+-.*\.vercel\.app$/.test(origin)) {
      cb(null, true);
    } else {
      console.warn(`⚠️ CORS Mismatch: ${origin}`);
      cb(null, false); // Não dá erro, apenas não autoriza o browser
    }
  },
  credentials: true,
}));

// Proteção de Cabeçalhos (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// DEBUG: Log all incoming requests
app.use((req, _res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.url}`);
  next();
});

// ── RATE LIMITING NATIVO (SERVERLESS) ──────────────────────────────────────────
// IMPORTANTE: Na Vercel (Serverless), a memória RAM não é persistida entre requests concorrentes.
// Usar rate-limit em memória é INÚTIL e uma falha de segurança fatal.
// O Redis é OBRIGATÓRIO para rate-limit em produção num ambiente Serverless.

const isProduction = process.env.NODE_ENV === "production";
const redisUrl = process.env.REDIS_URL || process.env.KV_URL; // Suporte a Upstash/Vercel KV

let redisClient: Redis | undefined;
let rateLimitStore: RedisStore | undefined;

if (redisUrl) {
  redisClient = new Redis(redisUrl);
  rateLimitStore = new RedisStore({
    sendCommand: (...args: string[]) => redisClient!.call(args[0], ...args.slice(1)) as any,
  });
  console.log("[SECURITY] Serverless-Native Redis Rate Limiter Ativado.");
} else if (isProduction) {
  console.error("❌ FALHA CRÍTICA DE ARQUITETURA: REDIS_URL não está configurado em produção.");
  console.error("   O rate-limiting em memória (RAM) NÃO FUNCIONA na Vercel (Serverless).");
  console.error("   O sistema está completamente VULNERÁVEL a ataques de Força Bruta e DDoS.");
  console.error("   Prossiga com extrema cautela ou configure o Upstash Redis imediatamente.");
}

const createRateLimiter = (options: { windowMs: number, max: number, message: string }) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    skip: () => !isProduction, // Desativa localmente para testes
    store: rateLimitStore, // Usa Redis se disponível, senão cai pro fallback inútil em memória
    message: { error: options.message }
  });
};

app.use("/api/auth/login", createRateLimiter({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: "Muitas tentativas de login falhas. Tente novamente em 15 minutos."
}));

app.use("/api/auth", createRateLimiter({ 
  windowMs: 5 * 60 * 1000, 
  max: 100,
  message: "Muitas tentativas. Tente novamente em breve." 
}));

app.use("/api/checkout", createRateLimiter({ 
  windowMs: 60 * 1000, 
  max: 20,
  message: "Muitas tentativas de checkout." 
}));

app.use("/api/webhooks", createRateLimiter({ 
  windowMs: 60 * 1000, 
  max: 50,
  message: "Rate limit excedido." 
}));

// Body parsers
// Webhook precisa do raw body para algumas validações de assinatura (se necessário)
app.use("/api/webhooks", express.raw({ type: "application/json" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static("uploads"));

// ── ROTAS PRINCIPAIS ─────────────────────────────────────────────────────────
app.use("/api", routes);

// Sentry Error Handler (Must be after routes)
Sentry.setupExpressErrorHandler(app);

// Tratamento de erros global
import { errorHandler } from "./middleware/error.middleware";
app.use(errorHandler);

export default app;
