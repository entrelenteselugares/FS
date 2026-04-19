"use strict";

/**
 * Vercel Serverless Function — Foto Segundo (Rescue Edition)
 * 
 * Agora com carregamento lazy para capturar erros de boot no runtime.
 */

module.exports = (req, res) => {
  try {
    // Carrega o servidor apenas quando a função é invocada
    // Isso permite capturar erros de require() ausentes
    const app = require("./server").default;
    
    if (!app) {
      throw new Error("Instância do servidor (Express) não encontrada no bundle.");
    }

    return app(req, res);
  } catch (err) {
    console.error("[CRITICAL BOOT ERROR]:", err.message);
    return res.status(500).json({
      error: "Falha catastrófica no boot do servidor.",
      message: err.message,
      diagnostic: {
        node: process.version,
        has_server_bundle: true,
        stack: err.stack,
        env: {
          has_db_url: !!process.env.DATABASE_URL,
          has_direct_url: !!process.env.DIRECT_URL
        }
      }
    });
  }
};
