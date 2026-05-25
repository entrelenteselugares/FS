<!-- generated-by: gsd-doc-writer -->
# Deployment Guide

O deploy da Foto Segundo é contínuo e integrado ao repositório GitHub através da **Vercel**, configurada para operar como ambiente Serverless unificado.

## Deployment Targets

A Foto Segundo opera de maneira híbrida num único domínio (Monólito na borda):

1. O Front-end (Vite/React) é servido na raiz global do domínio pela CDN da Vercel.
2. O Backend (Express/Node.js) é agrupado (bundled) em um arquivo Javascript Serverless via Vercel.

## Build Pipeline

Qualquer código consolidado na branch `main` disparará automaticamente o processo de Build na Vercel.

1. Instalação: `npm install`
2. Prisma Generate: `npx prisma generate --schema=backend/prisma/schema.prisma`
3. Build da API: Agrupamento com esbuild para o arquivo `api/server-v2.js`
4. Build do Frontend: `npm run build --prefix frontend`
5. Publicação: Vercel intercepta a pasta `public`.

## Environment Setup

No dashboard da Vercel > **Settings** > **Environment Variables**, garanta que todas as chaves mapeadas no CONFIGURATION.md estão presentes:

- `DATABASE_URL`: Com pgbouncer ativo para pooling Serverless.
- `DIRECT_URL`: Sem pgbouncer.
- `JWT_SECRET`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`

## Rollback Procedure

Caso seja necessário reverter o deploy:

1. Acesse o painel da Vercel.
2. Vá em **Deployments**.
3. Selecione o deploy anterior que estava funcionando.
4. Clique nos três pontos e selecione **Promote to Production** ou **Rollback**.

## Monitoring

- A Vercel fornece logs em tempo real na aba **Logs** do dashboard.
- Supabase oferece logs de banco de dados e performance na dashboard do projeto.
- O sistema inclui Sentry para tracking de erros e performance (`@sentry/node`).
