import * as Sentry from "@sentry/node";

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.warn("[SENTRY] SENTRY_DSN não configurado. Monitoramento desativado.");
    return;
  }

  Sentry.init({
    dsn,
    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    environment: process.env.NODE_ENV || "development",
  });

  console.log("[SENTRY] Inicializado com sucesso.");
}
