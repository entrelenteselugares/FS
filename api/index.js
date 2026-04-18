"use strict";

/**
 * Vercel Serverless Function — Foto Segundo
 * 
 * Usa o bundle auto-suficiente gerado pelo esbuild (api/server.js).
 * Todas as dependências (Express, cors, jwt, etc.) estão embutidas no bundle.
 * Apenas @prisma/client e multer são carregados de node_modules.
 */
const app = require("./server").default;

module.exports = (req, res) => {
  try {
    return app(req, res);
  } catch (err) {
    console.error("[BOOT ERROR]:", err.message);
    return res.status(500).json({
      error: "Falha na inicialização do servidor.",
      message: err.message,
      diagnostic: {
        node: process.version,
        has_db_url: !!process.env.DATABASE_URL,
        has_supabase_url: !!process.env.SUPABASE_URL,
        has_supabase_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    });
  }
};
