import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import routes from "./routes/index";
import { initSentry } from "./lib/sentry";
import * as Sentry from "@sentry/node";

initSentry();

const app = express();

// ── ROTA DE SAÚDE ULTRA-PRECOCE (Blindada) ───────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ 
    status: "ok", 
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

// Aviso não-fatal para variáveis opcionais importantes
if (!process.env.MASTER_EMAIL) {
  console.warn("⚠️  MASTER_EMAIL não configurada — Master Bypass desativado.");
}

// CRÍTICO: necessário para rate-limit funcionar na Vercel
app.set("trust proxy", 1);

// ── MIDDLEWARES DE SEGURANÇA & PARSERS ───────────────────────────────────────
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

// Rate limiting (Relaxado para desenvolvimento/produção MVP)
app.use("/api/auth", rateLimit({ 
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 100, // Aumentado de 10 para 100
  message: { error: "Muitas tentativas. Tente novamente em breve." } 
}));

app.use("/api/checkout", rateLimit({ 
  windowMs: 60 * 1000, 
  max: 10,
  message: { error: "Muitas requisições de checkout." } 
}));

app.use("/api/public", rateLimit({ 
  windowMs: 60 * 1000, 
  max: 60 
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
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("🔥 ERRO NO SERVIDOR:", err);
  res.status(500).json({ 
    error: "Erro interno no servidor", 
    message: err.message,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined
  });
});

export default app;
