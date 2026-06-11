# Phase 55: Infrastructure Resilience — Context

**Gathered:** 2026-05-30
**Status:** Ready for planning
**Source:** PRD Express Path — Post-Mortem Prospectivo (2026-05-30)

<domain>

## Phase Boundary

Esta fase resolve as 3 causas de morte identificadas no post-mortem prospectivo escrito em 2026-05-30, antes que o incidente real ocorra. Ela NÃO adiciona features de produto. É infraestrutura pura.

**O que esta fase entrega:**

1. Migração do storage de Google Drive → Cloudflare R2 (sem limite de quota, sem risco de banimento)
2. Sentry instalado com alertas de error rate no webhook de pagamento
3. `downloadAllMedia` e processamento Phygital movidos para Worker dedicado fora da Vercel
4. Redis (Upstash) como buffer para webhooks do Mercado Pago
5. 3 testes de integração cobrindo os fluxos críticos de pagamento e upload

**O que esta fase NÃO entrega:**

- Novas features de produto
- Analytics (Phase 56)
- Migração de banco de dados (Supabase → Neon é opcional, post-phase 55)

</domain>

<decisions>

## Implementation Decisions

### 1. Storage: Cloudflare R2

- **Tecnologia:** Cloudflare R2 (S3-compatible API)
- **SDK:** `@aws-sdk/client-s3` com endpoint customizado `https://<account-id>.r2.cloudflarestorage.com`
- **Pre-signed URLs:** Manter a mesma arquitetura de Resumable/Direct Upload implementada (Phase 53-54), mas trocar o destino do Google Drive para R2.
- **Variáveis de ambiente a adicionar:**
  - `R2_ACCOUNT_ID`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET_NAME`
  - `R2_PUBLIC_URL` (ex: `https://media.fotosegundo.com.br`)
- **Manutenção do Google Drive:** O serviço `googleDrive.service.ts` deve ser MANTIDO em paralelo durante a transição. Novas mídias irão para R2; as antigas ficam acessíveis no Drive pela `webViewLink` existente no banco.
- **Novo arquivo:** `backend/src/services/r2Storage.service.ts`

### 2. Observabilidade: Sentry

- **Pacote:** `@sentry/node` no backend, `@sentry/react` no frontend
- **Versão:** Latest stable
- **Inicialização:** `Sentry.init()` no topo de `backend/src/index.ts` antes de qualquer outro middleware
- **Alertas críticos a configurar via API/Dashboard:**
  - Error rate > 1% no endpoint `/api/webhooks/mercadopago` → PagerDuty / email
  - Error rate > 5% em qualquer endpoint → Slack/email
  - `P95 latency > 2000ms` em qualquer rota de upload
- **Variável de ambiente:** `SENTRY_DSN` (backend e frontend separados)

### 3. Worker Dedicado (Railway)

- **Operações a mover:**
  - `downloadAllMedia` (gera ZIP de todas as fotos de um cofre)
  - Processamento Phygital (`phygital.service.ts` — geração de PDF/layout para impressão)
- **Estratégia:** Criar uma API separada em `worker/` na raiz do projeto. Um Express.js mínimo com 2 endpoints:
  - `POST /jobs/zip-vault` — recebe `albumId`, gera ZIP e devolve URL assinada do R2 para download
  - `POST /jobs/phygital-process` — recebe pedido, processa PDF, devolve status
- **Comunicação:** O backend principal (Vercel) chama o Worker via HTTP com um `WORKER_SECRET` compartilhado para autenticar.
- **Deploy:** Railway (a partir de `/worker` com Dockerfile próprio)
- **Variáveis de ambiente no Vercel (backend principal):**
  - `WORKER_URL` (URL do Railway)
  - `WORKER_SECRET`

### 4. Redis Queue para Webhooks (Upstash)

- **Tecnologia:** Upstash Redis + `ioredis` (ou SDK nativo Upstash `@upstash/redis`)
- **Padrão:** O webhook do Mercado Pago recebe o evento, publica na fila Redis e retorna HTTP 200 imediatamente. Um consumer (dentro do Worker Railway) processa a fila de forma assíncrona.
- **Prioridade:** Implementar como opcional nesta fase se o Worker não estiver pronto. A idempotência já implementada (`updateMany WHERE status != APROVADO`) protege contra duplicatas mesmo sem fila. A fila é uma camada extra de resiliência.
- **Variáveis de ambiente:**
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

### 5. Testes de Integração

- **Framework:** Vitest + supertest (para Express) — já usado no backend
- **3 testes obrigatórios:**
  1. `webhook.approved.test.ts` — POST /api/webhooks/mercadopago com payload APROVADO → order.status === APROVADO no banco
  2. `webhook.duplicate.test.ts` — POST /api/webhooks/mercadopago com payload duplicado → idempotente (não cria 2 entradas)
  3. `upload.complete.test.ts` — POST /vaults/:id/upload/init + mock PUT R2 + POST /vaults/:id/upload/complete → media criada no banco
- **Banco de testes:** SQLite in-memory com Prisma (`datasource.url = "file::memory:"`)

### the agent's Discretion

- Ordem de commits dentro da fase
- UI dos erros do Sentry (ex: toast de "algo deu errado, já sabemos" vs. mensagem técnica)
- Nome das variáveis de ambiente específicas de Railway/Cloudflare além das listadas acima

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Storage atual (a ser migrado)

- `backend/src/services/googleDrive.service.ts` — implementação atual de storage, métodos `createResumableUploadUrl`, `finalizeResumableUpload`, `uploadFile`, `deleteItem`
- `backend/src/controllers/vault.controller.ts` — endpoints de upload (`initResumableUpload`, `completeResumableUpload`) que precisam ser redirecionados para R2

### Pagamento (webhook a ser protegido)

- `backend/src/controllers/payment.controller.ts` — lógica de idempotência já implementada, base para o teste de integração

### Worker atual (a ser externalizado)

- `backend/src/controllers/vault.controller.ts#downloadAllMedia` — função de ZIP a mover para o Worker
- `backend/src/services/phygital.service.ts` — processamento de pedidos físicos a mover para o Worker

### Ambiente e configuração

- `backend/.env.example` — deve receber as novas variáveis R2, Sentry, Worker, Upstash
- `.planning/phases/2c4e7c2c/post_mortem_6_meses.md` — diagnóstico e roadmap de sobrevivência (referência de prioridades)

</canonical_refs>

<specifics>

## Specific Ideas

- R2 Pre-signed PUT URLs devem ter expiração de 15 minutos (suficiente para upload de vídeos em conexões lentas no campo)
- O endpoint `/vaults/:id/download-all` no backend Vercel deve virar uma chamada de `enqueue` (dispara o Worker e devolve um job_id) em vez de fazer o ZIP em-memória
- O frontend deve exibir uma UI de "Seu download estará pronto em X minutos" com polling de status quando o Worker entrar em operação
- Sentry deve ser configurado com `tracesSampleRate: 0.1` (10% de traces) em produção para evitar custos

</specifics>

<deferred>

## Deferred Ideas

- Migração do Supabase para Neon.tech (avaliação técnica post-Phase 55, ao atingir 200 eventos/mês)
- Migração das mídias ANTIGAS do Google Drive para R2 (script de migração batch — opcional, as antigas permanecem acessíveis pelo `webViewLink`)
- Testes E2E de upload real (Playwright) — custo alto de infra, deixar para quando o Worker estiver estabilizado

</deferred>

---

_Phase: 055-infrastructure-resilience_
_Context gathered: 2026-05-30 via PRD Express Path (post-mortem prospectivo)_
