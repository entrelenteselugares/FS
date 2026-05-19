# 03 — Prompt de Sincronização de Contexto (Mestre)

**INSTRUÇÃO PARA A IA**: Atue como o assistente técnico sênior do projeto **Foto Segundo**. Leia o resumo abaixo e assuma o controle do desenvolvimento. Não faça perguntas sobre o que já foi decidido; apenas execute baseado nesta realidade.

---

## 🚀 CONTEXTO DO PROJETO: FOTO SEGUNDO

**Modelo**: B2B2C Phygital (Physical + Digital). Marketplace de fotos para eventos com impressão instantânea via Micro-franquias e Assinatura de Cofres de Memórias (Vault Sharing).
**Tech Stack**: Next.js 14, Node.js/Express, Prisma (PostgreSQL), Sharp (Image processing), Google OAuth2 (Calendar), **Google Drive API (Service Account / Cold Storage)**.

## 🛠️ ARQUITETURA CHAVE

1. **Foto Print Live**: O coração do Phygital. Convidado tira foto -> Sobe via QR Code -> Fotógrafo edita/carimba via Sharp -> Convidado compra -> Impressão automática no local.
2. **Print Agent**: App Node local que "pesca" da rota `/api/phygital/queue` e manda para a impressora.
3. **Design System**: "Midnight Luxury" (v3.0). Tokens em `theme.ts`, fontes 13px+, visual premium escuro/dourado.
4. **Cofres de Memórias (Vaults)**: Nova arquitetura da Fase 11 conectando o backend via *Service Account* diretamente à pastas raiz do Google Drive (Cold Storage), diminuindo custos de storage primário e automatizando processos (CronJobs).

## 📍 ESTADO ATUAL (HANDOFF)

- **Cofres de Memórias (Fase 11) Concluídos**:
  - Infraestrutura do Google Drive 100% mapeada no `.env` e testada (Backend).
  - CronJob diário (`vault-cycle.job.ts`) configurado para avaliar cofres abertos e gerar pedidos pendentes (`Order Engine`) para materialização automática.
  - Endpoint de Checkout Avulso / On-Demand integrado com Mercado Pago.
- **Integração de Notificações WhatsApp**:
  - Novo microserviço `wa-worker` (Baileys) criado e protegido por `x-api-key`.
  - Conexão do `whatsapp.service.ts` refatorada para fazer chamadas HTTP para o worker.
  - 4 gatilhos de WhatsApp injetados: Aceite de convite, Upload concluído, Ativação de materialização e Lembrete do ciclo (48h).
- **UI/UX App-Like (Midnight Luxury)**:
  - Navegação do usuário em cofres repaginada com remoção da `Navbar` no mobile em favor de um **BottomNav Imersivo**.
  - Interação gamificada: **Double-Tap to Vote** com animação Framer Motion nas fotos.
  - Botão de Materialização Imediata (R$ 49,90 + Frete Fixo).
- **Type Safety**: Backend e Frontend refatorados e aprovados pelo compilador sem erros (TSX/TS).
- **Resiliência e Deploy**: AuthController com fallback local, Theme anti-flicker e testes e2e de integração passando perfeitamente (77/77).

## 🎯 DIRETRIZES DE CODIFICAÇÃO

- SEMPRE use os tokens de `T` em `lib/theme.ts`.
- Mantenha a tipagem rigorosa (TypeScript). Evite `any` ou `unknown` se possível prever a estrutura (como fizemos no Axios Error).
- Documente mudanças críticas no diretório `ANOTAÇÕES/suporte_gemini/`.

---

**Kurio, o sistema está mapeado, testado e pronto para continuar. O que vamos codar agora?**
