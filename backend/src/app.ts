import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import rateLimit from "express-rate-limit";
import { PaymentController } from "./controllers/payment.controller";
import apiRoutes from "./routes/index";

const app = express();

/**
 * Trust proxy é OBRIGATÓRIO para que o express-rate-limit funcione corretamente
 * em ambientes como Vercel/proxies, detectando o IP real do cliente em vez do IP do gateway.
 */
app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.FRONTEND_URL ?? "http://localhost:5173",
  "https://foto-segundo.vercel.app",
  "https://fotosegundo.vercel.app",
];

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.filter(Boolean).includes(origin);
    // Permite qualquer URL de preview dinâmica do projeto na Vercel
    const isVercelPreview = /^https:\/\/foto-segundo-[a-z0-9]+-.*\.vercel\.app$/.test(origin);

    if (isAllowed || isVercelPreview) {
      callback(null, true);
    } else {
      // Especial: Permite que Webhooks do Mercado Pago passem pelo CORS se enviarem Origin
      if (origin.includes("mercadopago.com")) {
        return callback(null, true);
      }
      console.warn(`[CORS] Bloqueado para origin: ${origin}`);
      callback(new Error("CORS bloqueado por política de segurança"));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: "10mb" })); // Aumentado para suportar Base64 de imagens

// Uploads estáticos (Apenas para legado local, em produção usamos Supabase)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Rate Limiting — Proteção contra abuso
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60,
  message: { error: "Muitas requisições. Tente novamente em 1 minuto." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15,
  message: { error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: { error: "Limite de cadastros atingido por este IP. Tente novamente em 1 hora." },
  standardHeaders: true,
  legacyHeaders: false,
});

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { error: "Muitas tentativas de checkout. Aguarde 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Webhook do Mercado Pago – registrado ANTES do globalLimiter e sem auth.
 * Usa importação estática e handler direto para evitar conflito com o router.
 * O router também tem esta rota via /api/webhooks/mercadopago como fallback.
 */
app.post("/api/webhooks/mercadopago", PaymentController.webhook);

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", registerLimiter);
app.use("/api/checkout", checkoutLimiter);
app.use("/api", globalLimiter, apiRoutes);

// Tratamento de erros global
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ BACKEND ERROR:", err);
  res.status(500).json({ error: "Erro interno no servidor", details: err.message });
});

export default app;
