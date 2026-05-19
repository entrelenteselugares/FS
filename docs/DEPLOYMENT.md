# Deployment Guide

O deploy da Foto Segundo é contínuo e integrado ao repositório GitHub através da **Vercel**, configurada para operar como ambiente Serverless unificado.

## Arquitetura de Produção

A Foto Segundo opera de maneira híbrida num único domínio (Monólito na borda):
1. O Front-end (Vite/React) é compilado para arquivos estáticos e servido na raiz global do domínio pela CDN da Vercel.
2. O Backend (Express/Node.js) é agrupado (bundled) usando o `esbuild` em um único arquivo Javascript Serverless. Ele responde a todas as chamadas prefixadas em `/api/*`.

## Fluxo de Deploy Contínuo (CI/CD)

Qualquer código consolidado na branch `main` disparará automaticamente o processo de Build na Vercel.
Você pode acompanhar os logs no painel Vercel da organização.

### O Comando de Build Customizado
O pipeline de build é governado pelo script `vercel-build` definido no `package.json` raiz:

```json
"vercel-build": "npx prisma generate --schema=backend/prisma/schema.prisma && npm install --prefix frontend && npx esbuild backend/src/server.ts --bundle --minify --platform=node --target=node20 --outfile=api/server-v2.js --external:multer ... && npm run build --prefix frontend && node -e \"const fs=require('fs'); if(fs.existsSync('public')) fs.rmSync('public', {recursive:true,force:true}); fs.renameSync('frontend/dist', 'public')\""
```

**Este comando executa:**
1. Geração do Cliente Prisma (tipagens e bindings com o banco).
2. Instalação das dependências e build otimizado do React (Vite).
3. Agrupamento e minificação da API em um `server-v2.js` para carregamento imediato em Edge Functions.
4. Mapeamento das pastas estáticas do frontend para `public` a fim de serem interceptadas de forma transparente pelo engine da Vercel (`vercel.json`).

## Configurando Variáveis de Produção

A Vercel precisa ter acesso a todas as chaves críticas do sistema.
No dashboard da Vercel > **Settings** > **Environment Variables**, garanta que todas as chaves mapeadas no `CONFIGURATION.md` estão presentes, com destaque para:

- `DATABASE_URL`: Com pgbouncer ativo para pooling Serverless (termina em `?pgbouncer=true`).
- `DIRECT_URL`: Sem pgbouncer (termina na porta 5432).
- `JWT_SECRET`: Chave simétrica forte (exclusiva de produção).
- `MP_ACCESS_TOKEN` / `MP_WEBHOOK_SECRET`: Credenciais do Mercado Pago Produtivo.

## Deploy Manual

Se for necessário forçar o build manualmente a partir da sua máquina local:
```bash
npx vercel --prod --yes
```

Esse comando usará a CLI da Vercel para subir o estado atual do repositório, ignorando branches e empurrando um release imediato de produção. Mantenha cautela ao executar esse comando para evitar dessincronia com o estado real do GitHub.
