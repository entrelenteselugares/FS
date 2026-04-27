import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import routes from "./routes/index";

const app = express();

// ── VALIDAÇÃO DE AMBIENTE ───────────────────────────
const REQUIRED_ENVS = ["JWT_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
REQUIRED_ENVS.forEach(env => {
  if (!process.env[env]) {
    console.error(`❌ ERRO FATAL: Variável de ambiente ${env} não configurada.`);
    if (process.env.NODE_ENV === "production") process.exit(1);
  }
});

// CRÍTICO: necessário para rate-limit funcionar na Vercel
app.set("trust proxy", 1);

// ── MIDDLEWARES DE SEGURANÇA & PARSERS ───────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || 
        origin.startsWith("http://localhost:") || 
        origin.startsWith("http://127.0.0.1:") ||
        origin === "https://foto-segundo.vercel.app" ||
        /^https:\/\/foto-segundo-[a-z0-9]+-.*\.vercel\.app$/.test(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`CORS bloqueado - Origem: ${origin}`));
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
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));

// ── ROTAS PRINCIPAIS ─────────────────────────────────────────────────────────
app.use("/api", routes);

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", ts: new Date().toISOString() }));



// Tratamento de erros global
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ BACKEND ERROR:", err);
  res.status(500).json({ 
    error: "Erro interno no servidor", 
    details: err.message 
  });
});

export default app;
