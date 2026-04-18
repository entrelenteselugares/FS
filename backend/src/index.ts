import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import apiRoutes from "./routes/index";

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Blindagem contra falhas não capturadas
process.on("unhandledRejection", (reason) => console.error("Unhandled Rejection:", reason));
process.on("uncaughtException", (error) => console.error("Uncaught Exception:", error));

app.use(cors());
app.use(express.json());

// 2. Health Check (Independente do Banco)
app.get("/health", (_req, res) => res.json({ status: "alive" }));

// 3. Serve arquivos de uploads (Melhorado)
const uploadsPath = path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsPath));

// 4. Roteamento Unificado (Resolve conflitos de prefixo da Vercel)
app.use("/api", apiRoutes);
app.use("/", apiRoutes); 

// Handler de Erros Global (Senior Diagnostic)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ ERRO GLOBAL CAPTURADO:", err);
  res.status(500).json({ 
    error: "Erro Interno do Servidor", 
    message: err.message || "Falha desconhecida",
    code: err.code || "INTERNAL_ERROR",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    db_connected: !!process.env.DATABASE_URL
  });
});

export default app;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`🚀 Senior Backend running on http://localhost:${PORT}`));
}
 
 
 
