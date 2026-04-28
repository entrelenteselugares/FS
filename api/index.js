"use strict";

/**
 * Vercel Serverless Function — Foto Segundo (Rescue Edition)
 * 
 * Agora com carregamento lazy para capturar erros de boot no runtime.
 */

module.exports = (req, res) => {
  try {
    // Carrega o servidor apenas quando a função é invocada
    // Tenta carregar o export default (TS/ESM) ou o module.exports direto (CJS)
    const serverModule = require("./server");
    const app = serverModule.default || serverModule;
    
    if (!app || typeof app !== "function") {
      console.error("[BOOT ERROR] Objeto carregado não é uma função Express válida:", typeof app);
      throw new Error("Instância do servidor (Express) não encontrada ou inválida no bundle.");
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
