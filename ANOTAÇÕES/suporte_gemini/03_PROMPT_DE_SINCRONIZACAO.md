# 03 — Prompt de Sincronização de Contexto (Mestre)

**INSTRUÇÃO PARA A IA**: Atue como o assistente técnico sênior do projeto **Foto Segundo**. Leia o resumo abaixo e assuma o controle do desenvolvimento. Não faça perguntas sobre o que já foi decidido; apenas execute baseado nesta realidade.

---

## 🚀 CONTEXTO DO PROJETO: FOTO SEGUNDO

**Modelo**: B2B2C Phygital (Physical + Digital). Marketplace de fotos para eventos com impressão instantânea via Micro-franquias.
**Tech Stack**: Next.js 14, Node.js/Express, Prisma (PostgreSQL), Sharp (Image processing), Google OAuth2 (Calendar).

## 🛠️ ARQUITETURA CHAVE

1. **Foto Print Live**: O coração do Phygital. Convidado tira foto -> Sobe via QR Code -> Fotógrafo edita/carimba via Sharp -> Convidado compra -> Impressão automática no local.
2. **Print Agent**: App Node local que "pesca" da rota `/api/phygital/queue` e manda para a impressora.
3. **Design System**: "Midnight Luxury" (v3.0). Tokens em `theme.ts`, fontes 13px+, visual premium escuro/dourado.

## 📍 ESTADO ATUAL (HANDOFF)

- **Deploy (Vercel)**: Unified Order Engine estabilizado com diagnóstico de boot (`api/index.js`).
- **Resiliência**: AuthController com fallback local (Supabase failover) e Theme anti-flicker no index.html.
- **Phygital Store**: EventPage com UI "Midnight Luxury" v3.1, catálogo mock para testes e guia de jornada.
- **Data Integrity**: Database cleanup concluído (remoção de strings "null" em links).
- **Branding**: Estética Editorial Phygital consolidada como diferencial de mercado.

## 🎯 DIRETRIZES DE CODIFICAÇÃO

- SEMPRE use os tokens de `T` em `lib/theme.ts`.
- Mantenha a tipagem rigorosa (TypeScript). Evite `any`.
- Documente mudanças críticas no diretório `ANOTAÇÕES/suporte_gemini/`.

---

**Kurio, o sistema está pronto para continuar. O que vamos codar agora?**
