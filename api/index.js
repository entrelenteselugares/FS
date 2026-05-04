"use strict";

/**
 * Vercel Serverless Function — Foto Segundo (Rescue Edition)
 * 
 * Agora com carregamento lazy para capturar erros de boot no runtime.
 */

module.exports = (req, res) => {
  console.log("[WRAPPER] Invocação da API - Ver: 2fcb999-crypto-fix");
  try {
    // Carrega o servidor apenas quando a função é invocada
    // Tenta carregar o export default (TS/ESM) ou o module.exports direto (CJS)
    const serverModule = require("./server-v2");
    const app = serverModule.default || serverModule;
    
    if (!app || typeof app !== "function") {
      console.error("[BOOT ERROR] Objeto carregado não é uma função Express válida:", typeof app);
      throw new Error("Instância do servidor (Express) não encontrada ou inválida no bundle.");
    }

    return app(req, res);
  } catch (err) {
    return res.status(500).json({
      status: "BOOT_FAILURE",
      error: "Falha no carregamento do módulo do servidor.",
      message: err.message,
      diagnostic: {
        node: process.version,
        time: new Date().toISOString(),
        env: {
          has_db_url: !!process.env.DATABASE_URL,
          has_supabase_url: !!process.env.SUPABASE_URL,
          has_jwt_secret: !!process.env.JWT_SECRET,
          node_env: process.env.NODE_ENV
        },
        stack: err.stack?.split("\n").slice(0, 5)
      }
    });
  }
};
