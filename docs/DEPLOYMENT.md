<!-- generated-by: gsd-doc-writer -->

# Deployment Guide

O deploy da Foto Segundo é contínuo e integrado ao repositório GitHub através da **Vercel**, configurada para operar como ambiente Serverless unificado, juntamente com instâncias complementares no Supabase Edge Functions para processos específicos.

## Deployment Targets

A Foto Segundo opera de maneira híbrida num único domínio (Monólito na borda):

1. **Frontend (Vite/React)**: É servido na raiz global do domínio pela CDN global da Vercel.
2. **Backend Híbrido**:
   - **Vercel API**: A maior parte da API é executada no Vercel Node.js Serverless (Hono) para acesso ultrarrápido ao banco de dados Prisma e sem as limitações de bundle do Deno.
   - **Supabase Edge Functions (Deno)**: Utilizado estritamente para Webhooks do Mercado Pago, submissões sensíveis à latência de borda ou quando o limite de Payload/Timeout da Vercel é insuficiente, mantendo a Fragmentação Estratégica.

## Build Pipeline

Qualquer código consolidado na branch `main` disparará automaticamente o processo de Build na Vercel.

1. Instalação: `npm install`
2. Prisma Generate: `npx prisma generate --schema=backend/prisma/schema.prisma`
3. Build da API: Compilação das rotas serverless do Hono para `api/`.
4. Build do Frontend: `npm run build --prefix frontend`
5. Publicação: Vercel intercepta o diretório de build do frontend.

## Environment Setup

No dashboard da Vercel > **Settings** > **Environment Variables**, garanta que todas as chaves mapeadas no CONFIGURATION.md estão presentes:

- `DATABASE_URL`: Com pgbouncer ativo (porta 6543) para pooling Serverless com Prisma.
- `DIRECT_URL`: Sem pgbouncer (porta 5432) para execução limpa de migrations.
- `JWT_SECRET`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`
- `CRON_SECRET`: Para rotinas como o carrinho abandonado e crm-recovery.

## Bundle Optimization e Fragmentation

Como a plataforma gera PDFs, envia e-mails em massa com Resend e manipula imagens pesadas (Jimp/Sharp), o deploy pode estourar o limite da Vercel Edge de 1MB/50MB (Free/Pro) ou de memória. Se ocorrerem erros de `Function Payload Too Large` ou lentidão por Cold Starts gigantescos:

- Rotas de PDF generation devem ficar em rotas Vercel Edge exclusivas sem carregar o monólito inteiro ou movidas para Lambdas isoladas.
- Siga as estratégias em `.planning/knowledge/backend_infrastructure_scaling/`.

## Rollback Procedure

Caso seja necessário reverter o deploy:

1. Acesse o painel da Vercel.
2. Vá em **Deployments**.
3. Selecione o deploy anterior que estava funcionando.
4. Clique nos três pontos e selecione **Promote to Production** ou **Rollback**.

## Monitoring

- A Vercel fornece logs em tempo real na aba **Logs** do dashboard.
- Supabase oferece logs de banco de dados e performance na dashboard do projeto.
- O sistema inclui Sentry para tracking de erros e performance de interface.

<!-- GSD-DOCS-UPDATE: SUPPLEMENTED -->

_Documentação verificada e atualizada automaticamente via GSD-SDK em 2026-06._
