# 🔍 AUDITORIA COMPLETA DO SISTEMA — FOTO SEGUNDO

**Data:** 27/04/2026  
**Versão:** v2.4 (Sprint: CRM de Campo + Marketplace)  
**Status Geral:** ✅ Estável em produção | ⚠️ 2 bugs críticos abertos

---

## 1. STACK TECNOLÓGICA

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend | React + Vite + TypeScript | Node 20.x |
| Backend | Express.js + TypeScript | Node 20.x |
| ORM | Prisma | v6.19.3 |
| Banco de Dados | PostgreSQL (Supabase) | — |
| Auth | Supabase Auth + JWT próprio | — |
| Pagamentos | Mercado Pago (Checkout Pro + Transparente) | — |
| Deploy | Vercel (Monorepo) | CLI 51.6.1 |
| Storage | Supabase Storage (Bucket: `eventos`) | — |
| Email | Supabase Auth nativo (resetPasswordForEmail) | — |
| Cron | Vercel Cron Jobs (diário 06:00) | — |

---

## 2. ARQUITETURA DE DEPLOY

```
foto-segundo/         ← Raiz do monorepo
├── frontend/         ← Vite/React (compilado → /index.html)
├── backend/          ← Express (compilado → /api/index.js)
├── api/              ← Entry-point serverless Vercel
└── vercel.json       ← Rewrites: /api/* → api/index.js | /* → index.html
```

**Cron Job ativo:** `GET /api/cron/expiration` — roda diariamente às 06:00 UTC  
Protegido por `CRON_SECRET` no header Authorization.

---

## 3. MAPA DE ROTAS (Backend)

### 🔓 Públicas (sem autenticação)

| Método | Rota | Controller | Função |
|---|---|---|---|
| POST | `/auth/login` | AuthController | Login com JWT |
| POST | `/auth/register` | AuthController | Registro de usuário |
| POST | `/auth/forgot-password` | AuthController | Reset via Supabase Auth |
| POST | `/auth/update-password` | AuthController | Atualiza senha pós-reset |
| GET | `/auth/me` | AuthController | Dados do usuário logado |
| PATCH | `/auth/me` | AuthController | Atualiza nome/WhatsApp |
| POST | `/auth/refresh` | AuthController | Refresh token |
| GET | `/public/events` | EventController | Vitrine pública (filtra: active=true, isPrivate=false) |
| GET | `/public/events/:slug` | EventController | Detalhe do evento (paywall) |
| GET | `/public/orders/:id` | PaymentController | Resumo do pedido |
| GET | `/public/orders/:id/check-payment` | PaymentController | Polling status MP |
| POST | `/public/quotes` | EventController | Formulário de cotação |
| POST | `/checkout/payment` | PaymentController | Pagamento transparente |
| POST | `/webhooks/mercadopago` | PaymentController | Webhook MP |

### 🔐 Profissional (requireAuth + requireRole PROFISSIONAL/ADMIN)

| Método | Rota | Função |
|---|---|---|
| GET | `/profissional/events` | Lista eventos atribuídos |
| PATCH | `/profissional/events/:id/links` | Salva links Lightroom/Drive |
| PATCH | `/profissional/events/:id/cover` | Upload de capa |
| PATCH | `/profissional/events/:id/respond` | Aceitar/Recusar convite |
| POST | `/profissional/events/:id/manual-sale` | Venda física (SD card, etc) |
| GET | `/profissional/me` | Perfil + stats de ganhos |
| PATCH | `/profissional/me` | Atualiza perfil profissional |

### 🏪 Marketplace (requireAuth + requireRole PROFISSIONAL/ADMIN)

| Método | Rota | Função |
|---|---|---|
| POST | `/marketplace/express-sale` | **Venda Rápida** — cria evento + pedido |
| POST | `/marketplace/events/:id/media` | Upload de foto individual |
| GET | `/marketplace/events/:id/media` | Lista fotos para venda |

### 🏢 Unidade Fixa (requireRole CARTORIO/UNIDADE/ADMIN)

| Método | Rota | Função |
|---|---|---|
| GET | `/unidade-fixa/stats` | Estatísticas da unidade |
| GET | `/unidade-fixa/events` | Eventos da unidade |
| GET | `/unidade-fixa/orders` | Pedidos da unidade |
| PATCH | `/unidade-fixa/profile` | Atualiza perfil |
| GET/PUT | `/unidade-fixa/team` | Gestão da equipe |

### 👑 Admin (requireRole ADMIN)

| Área | Rotas |
|---|---|
| Stats | `GET /admin/stats` |
| Eventos | `GET/POST/PATCH/DELETE /admin/events` |
| Usuários | `GET/POST/PATCH/DELETE /admin/users` |
| Pedidos | `GET /admin/orders` |
| Cotações | `GET /admin/quotes`, `PATCH /admin/quotes/:id/approve` |
| Repasses | `POST /admin/payouts/generate`, `GET /admin/payouts` |
| Configs | `GET/PATCH /admin/configs` |
| Fornecedores | `GET/POST /admin/suppliers` |
| Concursos | `GET/POST/PATCH /admin/contests` |
| Catálogo Imp. | `GET/POST/PATCH /admin/print-catalog` |

---

## 4. MAPA DE PÁGINAS (Frontend)

### Públicas

| Rota | Arquivo | Descrição |
|---|---|---|
| `/` | `HomePage.tsx` | Vitrine com busca de álbuns |
| `/login` | `LoginPage.tsx` | Login unificado |
| `/register` | `RegisterPage.tsx` | Cadastro de usuários |
| `/auth` | `AuthSelectionPage.tsx` | Seleção de perfil |
| `/e/:slug` | `EventPage.tsx` | Página do evento + paywall + checkout |
| `/checkout/:orderId` | `CheckoutPage.tsx` | Pagamento Pix/Cartão |
| `/cotacao` | `QuotePage.tsx` | Wizard de orçamento |
| `/p/:slug` | `PartnerLP.tsx` | Landing page de unidade fixa |
| `/reset-password` | `ResetPasswordPage.tsx` | Redefinição de senha |
| `/hall-of-fame` | `HallOfFame.tsx` | Ranking de fotos (gamificação) |
| `*` | `NotFoundPage.tsx` | 404 |

### Área Logada

| Rota | Arquivo | Acesso |
|---|---|---|
| `/minha-conta` | `ClienteArea.tsx` | CLIENTE |
| `/profissional` | `ProfissionalDashboard.tsx` | PROFISSIONAL |
| `/unidade-fixa` | `UnidadeFixaDashboard.tsx` | CARTORIO/UNIDADE |

### Admin (`/admin/*`)

| Sub-rota | Arquivo | Descrição |
|---|---|---|
| `/admin` | `AdminDashboard.tsx` | Shell com navegação lateral |
| ↳ `overview` | `AdminOverview.tsx` | KPIs e alertas |
| ↳ `events` | `AdminEvents.tsx` | Gestão de álbuns |
| ↳ `users` | `AdminUsers.tsx` | Usuários da rede |
| ↳ `orders` | `AdminOrders.tsx` | Pedidos e auditoria |
| ↳ `quotes` | `AdminQuotes.tsx` | Leads e cotações |
| ↳ `finance` | `AdminFinance.tsx` | Repasses semanais |
| ↳ `print-catalog` | `AdminPrintCatalog.tsx` | Catálogo de impressão CK |
| ↳ `configs` | `AdminConfigs.tsx` | Configurações do sistema |
| ↳ `services` | `AdminServices.tsx` | Serviços cadastrados |
| ↳ `suppliers` | `AdminSuppliers.tsx` | Fornecedores |
| ↳ `contests` | `AdminContests.tsx` | Concursos de fotos |

---

## 5. BANCO DE DADOS — MODELOS ATIVOS

| Tabela | Descrição | Campos-chave |
|---|---|---|
| `users` | Todos os usuários da plataforma | `id`, `email`, `role`, `whatsapp`, `pixKey` |
| `events` | Álbuns/operações fotográficas | `active`, `isPrivate`, `isQuote`, `type`, `slug` |
| `orders` | Pedidos de compra | `status`, `hasPaid`, `isManual`, `manualType` |
| `order_items` | Itens de pedido (marketplace) | `mediaId`, `serviceId`, `price` |
| `profissionais` | Perfil dos fotógrafos/editores | `captPct`, `editPct`, `equipment`, `services` |
| `cartorios` | Perfil das unidades fixas | `razaoSocial`, `cidade`, `splitPct` |
| `cartorio_profissionais` | Vínculo profissional↔unidade | `tipo` (FIXO/EXTRA), `status` |
| `event_media` | Fotos individuais para venda | `url`, `shortId`, `price` |
| `weekly_payouts` | Repasses semanais | `weekStart`, `weekEnd`, `status` |
| `payout_items` | Linhas de repasse por beneficiário | `recipientType`, `amount`, `pixKey` |
| `print_products` | Catálogo de impressão CK | `sku`, `category`, `supplierCost`, `marginPct` |
| `audit_logs` | Logs de ações administrativas | `userId`, `action`, `details` |
| `platform_configs` | Configurações do sistema | `key`, `value` |
| `contests` | Concursos de fotos | `status`, `startDate`, `endDate` |

### Enums

- **Role:** `ADMIN`, `CARTORIO`, `PROFISSIONAL`, `CLIENTE`
- **EventType:** `ALBUM_FULL`, `PHOTO_MARKETPLACE`
- **AcceptanceStatus:** `PENDING`, `ACCEPTED`, `REJECTED`
- **QuoteStatus:** `PENDING`, `APROVADO`, `REJECTED`, `CONVERTED`, `PRICED`
- **PayoutStatus:** `PENDING`, `PROCESSING`, `PAID`, `CANCELLED`

---

## 6. SERVIÇOS E LÓGICAS CRÍTICAS

### PricingService (`backend/src/services/pricing.service.ts`)

- **`calculateEventPrice(event, contributionAmount?, cartItems?)`** — preço dinâmico (early bird, crowdfund, marketplace)
- **`calculateSplits(amount)`** — distribui splits: Matriz, Captação, Edição, Cartório

### NotificationService (`backend/src/services/notification.service.ts`)

- Envio de e-mail via SMTP (quando configurado) ou Supabase nativo
- Métodos: `sendAccessEmail`, `notifyNewSale`, `notifyPaymentIssue`, `notifyProfessionalNewAssignment`
- ⚠️ **SMTP não configurado no ambiente atual** — depende do Supabase Auth para reset de senha

### MercadoPagoService (`backend/src/services/mercadopago.service.ts`)

- Criação de preferências (Checkout Pro)
- Pagamento transparente (Cartão/PIX)
- Consulta de status de pagamento

---

## 7. FLUXOS PRINCIPAIS

### Fluxo de Venda Rápida (Marketplace)

```
Fotógrafo → Modal "Venda Rápida" → POST /marketplace/express-sale
  → Cria User (se não existir)
  → Cria Event (active: false, isPrivate: true, type: PHOTO_MARKETPLACE)
  → Cria Order (status: PAGO se dinheiro | PENDENTE se PIX/Cartão)
  → [PIX/Cartão] → Redireciona para /checkout/:orderId
  → [Dinheiro] → Confirma direto na tela
```

### Fluxo de Pagamento Digital

```
Cliente → /e/:slug → Seleciona itens → POST /checkout/payment
  → MercadoPago processa
  → [Aprovado] → Event.active = true + Notificações
  → [Pendente PIX] → Polling GET /public/orders/:id/check-payment (5s)
  → [Webhook MP] → Fallback de confirmação
```

### Fluxo de Recuperação de Senha

```
Cliente → /login → "Esqueci minha senha"
  → POST /auth/forgot-password
  → Supabase.auth.resetPasswordForEmail()
  → Email com link para /reset-password
  → PATCH /auth/update-password (extrai access_token do hash da URL)
```

### Fluxo de Cotação (Orçamento)

```
Cliente → /cotacao (Wizard 5 etapas)
  → Seleção de Unidade Fixa OU local personalizado
  → POST /public/quotes → Cria Event(isQuote:true)
  → Admin aprova → PATCH /admin/quotes/:id/approve
  → Event(active:true) + Order(PENDENTE) criados
  → Cliente recebe link de pagamento
```

---

## 8. BUGS ABERTOS (27/04/2026)

### 🔴 BUG CRÍTICO #1 — Eventos do Marketplace aparecendo na Homepage

**Sintoma:** Álbuns criados via "Venda Rápida" aparecem na vitrine pública (`/`), mesmo com pagamento pendente.  
**Causa confirmada:** Os eventos estão sendo salvos como `active: true` e `isPrivate: false` no banco, ao contrário do que o código especifica (`active: false`, `isPrivate: true`).  
**Hipótese:** O banco de dados (Supabase) pode estar aplicando um migration conflitante ou o Prisma Client gerado está desatualizado em produção.  
**Status:** 🔍 Em investigação  
**Workaround imediato:** Script de limpeza executado para eventos existentes.

### 🔴 BUG CRÍTICO #2 — Álbum de Venda Rápida acessível sem pagamento

**Sintoma:** A página do evento (`/e/:slug`) exibe a interface de seleção de fotos mesmo com o pedido em status `PENDENTE`.  
**Causa:** O `EventController.getById` não bloqueia o acesso ao evento para pedidos pendentes do tipo PHOTO_MARKETPLACE.  
**Status:** 🔍 Requer correção no `event.controller.ts`

---

## 9. VARIÁVEIS DE AMBIENTE NECESSÁRIAS

### Backend (`.env`)

```
DATABASE_URL=          # Connection pooling (PgBouncer)
DIRECT_URL=            # Conexão direta Supabase
SUPABASE_URL=          # URL do projeto Supabase
SUPABASE_SERVICE_KEY=  # Service Role Key (admin)
JWT_SECRET=            # Secret para tokens JWT próprios
MP_ACCESS_TOKEN=       # Mercado Pago Access Token
MP_WEBHOOK_SECRET=     # Secret para validação de webhook MP
CRON_SECRET=           # Proteção do endpoint de cron
FRONTEND_URL=          # https://foto-segundo.vercel.app
BACKEND_URL=           # https://foto-segundo.vercel.app
```

### Frontend (`.env.local`)

```
VITE_API_URL=          # URL da API backend
VITE_MP_PUBLIC_KEY=    # Chave pública Mercado Pago
```

### ⚠️ NÃO CONFIGURADAS (funcionalidades degradadas)

- `SMTP_USER` / `SMTP_PASS` — Notificações por e-mail via SMTP próprio desativadas
- `MP_WEBHOOK_SECRET` — Webhook sem validação de assinatura (modo não-seguro)

---

## 10. SEGURANÇA

| Controle | Status |
|---|---|
| Rate Limiting global (60 req/min) | ✅ Ativo |
| Rate Limiting auth/checkout (10-15/15min) | ✅ Ativo |
| Trust Proxy (Vercel) | ✅ Configurado |
| JWT com Refresh Token (1h access / 7d refresh) | ✅ Ativo |
| Validação de propriedade de evento (IDOR) | ✅ Corrigido |
| Webhook MP com validação HMAC | ⚠️ Desativado (sem secret) |
| Privacy by Default (isPrivate: true nas vendas) | ✅ Implementado |
| Audit Log em ações críticas | ✅ Ativo |

---

## 11. ESTADO DO DEPLOY

- **Branch principal:** `main`
- **URL produção:** `https://foto-segundo.vercel.app`
- **Último commit:** `d151e40` — `fix: remove VENDA prefix from express sale album names`
- **Node.js:** `20.x` (forçado via `engines` no `package.json`)
- **Prisma Client gerado em:** build do Vercel (via `postinstall`)

---

> **Próximos passos críticos:**
>
> 1. Corrigir BUG #1 (eventos marketplace ativos sem pagamento)
> 2. Corrigir BUG #2 (acesso ao album sem pagamento confirmado)  
> 3. Configurar `MP_WEBHOOK_SECRET` no painel Vercel
> 4. Testar fluxo de reset de senha em produção após estabilização do Supabase
