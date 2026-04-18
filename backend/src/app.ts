import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import apiRoutes from "./routes/index";

const app = express();

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
      console.warn(`[CORS] Bloqueado para origin: ${origin}`);
      callback(new Error("CORS bloqueado por política de segurança"));
    }
  },
  credentials: true,
}));

// Webhook do Mercado Pago (se houver) pode precisar de body raw futuramente
// app.use("/api/webhooks", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "10mb" })); // Aumentado para suportar Base64 de imagens

// Uploads estáticos (Apenas para legado local, em produção usamos Supabase)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (_req, res) =>
  res.json({ status: "ok", ts: new Date().toISOString() })
);

app.use("/api", apiRoutes);

// Tratamento de erros global
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ BACKEND ERROR:", err);
  res.status(500).json({ error: "Erro interno no servidor", details: err.message });
});

export default app;
