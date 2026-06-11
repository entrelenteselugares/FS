---
phase: 55
plan: 1
subsystem: infrastructure
tags: [storage, r2, resilience]
key-files:
  - backend/src/services/r2Storage.service.ts
  - backend/src/controllers/vault.controller.ts
  - frontend/src/pages/VaultDetailPage.tsx
metrics:
  files_changed: 4
---

# Plan 1 Summary: R2 Storage Migration

## What Was Accomplished

- **R2 Storage Service**: Criado `r2Storage.service.ts` no backend, implementando a mesma interface de Pre-signed URLs (`createPresignedUploadUrl`) usando o `@aws-sdk/client-s3`.
- **Backend Refactoring**: Atualizado `vault.controller.ts` para que `initResumableUpload` use R2 e retorne `storageType: 'r2'`. Modificado `completeResumableUpload` para aceitar `key` e `publicUrl` diretamente, sem necessidade de validação adicional com a API do Google Drive no meio do processo de conclusão do upload.
- **Frontend Compatibility**: Atualizado `VaultDetailPage.tsx` para interceptar a resposta do init com `storageType`, fazer o upload via `PUT` nativo no formato que o S3/R2 espera e enviar a nova `key` ao concluir. Fallback de mock mantido.
- **Environment config**: Variáveis do Cloudflare R2 adicionadas a `backend/.env.example`.

## Self-Check: PASSED

- `r2Storage.service.ts` implementado.
- Frontend e backend configurados para interagir com R2 mantendo o fluxo existente e idempotente.
- Typescript compilações foram validadas.
