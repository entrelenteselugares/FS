---
phase: 55
plan: 3
subsystem: infrastructure
tags: [worker, zip, railway]
key-files:
  - worker/package.json
  - worker/src/index.ts
  - worker/src/jobs/zip-vault.ts
  - backend/src/controllers/vault.controller.ts
  - frontend/src/pages/VaultDetailPage.tsx
metrics:
  files_changed: 8
---

# Plan 3 Summary: Dedicated Worker for Heavy Jobs

## What Was Accomplished
- **Worker Setup**: Inicializada a nova aplicação `worker/` com Express, TypeScript e Dockerfile prontos para deploy no Railway.
- **ZIP via Streaming**: Criada a rota `POST /jobs/zip-vault` no Worker. Ela lê arquivos em lote (chunks de 20 para eficiência de RAM) e faz streaming diretamente para um `Upload` do R2 usando `PassThrough` da lib `archiver`, retornando uma presigned URL que expira em 1h.
- **Dispatcher no Backend**: O endpoint problemático `GET /download-all` da Vercel foi reduzido de 100 linhas de stream/archiver bloqueante para ser apenas um dispatcher. Ele aciona o Worker enviando o contexto (mediaList) e retorna o JSON `{ downloadUrl }` pro cliente. Resposta imediata, sem timeouts de 60s.
- **Frontend**: `VaultDetailPage.tsx` atualizada para abrir o `downloadUrl` numa nova aba em vez de processar o chunk binário em memória e criar URL object, economizando CPU no device do usuário.

## Self-Check: PASSED
- `worker/` isolado com sua própria cadeia de dependências e `package.json`.
- `WORKER_SECRET` e headers configurados para garantir segurança da rota do worker.
- O método de ZIP não guarda o arquivo todo em memória.
- Compilação dos typescripts de frontend e backend OK.
