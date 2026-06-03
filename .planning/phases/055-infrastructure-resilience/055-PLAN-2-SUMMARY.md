---
phase: 55
plan: 2
subsystem: infrastructure
tags: [sentry, observability, resilience]
key-files:
  - backend/src/app.ts
  - backend/src/lib/sentry.ts
  - frontend/src/main.tsx
  - frontend/src/lib/sentry.ts
metrics:
  files_changed: 3
---

# Plan 2 Summary: Sentry Observability

## What Was Accomplished

- **Backend Error Handler**: `Sentry.setupExpressErrorHandler(app)` configurado em `backend/src/app.ts` para capturar exceções não tratadas globalmente nas rotas da API. A inicialização de Sentry já estava presente.
- **Frontend Error Tracking**: Verificada a integração do Sentry no React, a qual já engloba o roteador V6, Replays e captura de falhas em `main.tsx`.
- **Environment**: Atualizados arquivos `.env.example` com o placeholder `SENTRY_DSN` e `VITE_SENTRY_DSN`.

## Self-Check: PASSED

- `setupExpressErrorHandler` posicionado corretamente no express app (antes do global error handler e após rotas).
- `SENTRY_DSN` documentado para o dev.
