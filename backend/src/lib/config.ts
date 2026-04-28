/**
 * Configurações globais centralizadas.
 * Todas as referências a URLs base devem importar daqui
 * para evitar fallbacks hardcoded espalhados pelos controllers.
 */

export const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://foto-segundo.vercel.app";

export const APP_URL = process.env.APP_URL || FRONTEND_URL;
