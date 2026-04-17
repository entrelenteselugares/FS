import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";

import apiRoutes from "./routes/index";

const app = express();
const PORT = process.env.PORT || 3001;

if (!process.env.BACKEND_URL) {
  process.env.BACKEND_URL = `http://localhost:${PORT}`;
}

app.use(cors());
app.use(express.json());

// Serve arquivos de uploads como estáticos
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Registro das Rotas - Flexível para evitar erros de prefixo na Vercel
app.use("/api", apiRoutes);
app.use("/", apiRoutes); // Fallback para quando a Vercel já removeu o prefixo /api

// ── Dev Helpers ───────────────────────────────────────────────────
app.locals.MOCK_PAID = false;

app.get("/api/dev/pay", (req, res) => {
  req.app.locals.MOCK_PAID = true;
  res.json({ success: true, message: "Pagamento Simulado com Sucesso!" });
});

app.get("/api/dev/status", (req, res) => {
  res.json({ paid: req.app.locals.MOCK_PAID });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "Foto Segundo Backend v2.0 — Auth + RBAC + Split" });
});

// Exportar para Vercel
export default app;

// Só rodar o listen se não estivermos no ambiente Serverless da Vercel
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Senior Backend running on http://localhost:${PORT}`);
  });
}
