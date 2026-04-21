import dotenv from "dotenv";
dotenv.config();

// Blindagem contra falhas não capturadas
process.on("unhandledRejection", (reason) => {
  console.error("❌ UNHANDLED REJECTION:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ UNCAUGHT EXCEPTION:", error);
});

/**
 * Importa o APP principal (com todas as configurações de segurança, 
 * trust proxy, rate limiting e rotas estabilizadas).
 */
import app from "./app";

const PORT = process.env.PORT || 3001;

/**
 * Export padrão para o Vercel Bundle (api/server.js)
 */
export default app;

/**
 * Inicialização local (Bypass em produção)
 */
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Foto Segundo Backend running on http://localhost:${PORT}`);
    console.log(`🛡️  Trust Proxy: ${app.get("trust proxy")}`);
  });
}
