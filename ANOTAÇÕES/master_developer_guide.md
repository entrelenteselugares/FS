# Master Developer Guide: Foto Segundo (V2.0 — Produção Estável)

> **Última revisão:** Abril / 2026
> **Status da produção:** ✅ Estável em `foto-segundo.vercel.app`

Bem-vindo ao motor da **Foto Segundo**. Este guia é a referência definitiva de arquitetura, fluxos de negócio e decisões técnicas da plataforma. A estética é chamada de **"Midnight Luxury"**: dark mode severo, tipografia Outfit, e a cor de marca `#85B9AC` (teal).

---

## 1. Visão Geral da Arquitetura

O sistema é um **Mono-repo híbrido** projetado para escala e resiliência em ambientes serverless (Vercel).

| Camada | Tecnologia | Observação |
| :--- | :--- | :--- |
| **Frontend** | React + Vite + TypeScript | Estética Midnight Luxury, dark mode |
| **Backend** | Node.js + Express | API REST em `/api`, stateless |
| **Banco de Dados** | PostgreSQL via **Supabase** | ORM: Prisma v6 com `adapter-pg` |
| **Auth** | Supabase Auth + JWT | Self-healing: sincroniza UIDs automaticamente |
| **Storage** | Supabase Storage | Bucket `eventos` para capas de eventos |
| **Deploy** | Vercel (monorepo) | Build automático a cada push na `main` |

### ⚠️ Ponto Crítico: Conexão com o Banco

O Supabase expõe **duas** URLs de conexão — ambas são necessárias no `.env`:

- **`DATABASE_URL`** → Aponta pro **Transaction Pooler** (PgBouncer). Usada em produção pela API. Não suporta migrações.
- **`DIRECT_URL`** → Aponta para o banco **diretamente**. Deve ser usada para `prisma db push` e `prisma migrate`. **Nunca use em produção serverless.**

---

## 2. Roles e Controle de Acesso (RBAC)

| Role | Painel | Capacidades |
| :--- | :--- | :--- |
| `ADMIN` | `/admin` | Acesso total: eventos, usuários, finanças, configurações |
| `PROFISSIONAL` | `/profissional` | Agenda, convites de serviço, perfil técnico, links de entrega |
| `CARTORIO` | `/unidade-fixa` | QR distribution, estatísticas da unidade, landing page |
| `CLIENTE` | `/minha-conta` | Visualizar álbuns comprados, gamificação, LGPD |

### 👤 Usuários de Produção (referência)

- **Matriz / Admin:** `entrelenteselugares@gmail.com` — role `ADMIN`
- **Profissional de teste:** `matheuskurio@gmail.com` — role `PROFISSIONAL`

### 🔐 Self-Healing Auth

O `AuthController.login` detecta automaticamente desalinhamentos de UID entre o Supabase Auth e o Prisma. Se o `id` do usuário no banco não corresponder ao UID do Supabase, o sistema **corrige silenciosamente** via SQL direto, sem alterar a `role` cadastrada.

---

## 3. Core Workflows (Fluxos de Negócio)

### A. Sistema de Convites para Profissionais (NOVO em V2.0)

1. O Admin cria ou edita um evento e atribui um `captacaoId` ou `edicaoId` (usuário com role `PROFISSIONAL`).
2. O profissional vê o evento na aba **"Convites Pendentes"** do seu painel.
3. Ao **Aceitar** (`PATCH /api/profissional/events/:id/respond { status: "ACCEPTED" }`), o evento move-se para **"Minha Agenda"**.
4. Ao **Recusar**, o evento é descartado da fila do profissional.

O campo `captacaoStatus` / `edicaoStatus` no modelo `Event` registra o estado: `PENDING | ACCEPTED | REJECTED`.

### B. Captação de Leads (Quotes)

1. Usuários acessam `/cotacao` — cria um `Event` com `isQuote: true`.
2. O Admin precifica no painel `/admin/quotes` e aprova.
3. O evento se torna operacional (`isQuote: false`, `active: true`).

### C. O Dia do Evento

1. Profissional atribuído acessa o painel e sobe a **foto de capa** (base64 → Supabase Storage).
2. Insere links de entrega: **Adobe Portfolio** (galeria) e **Google Drive** (vídeo bruto).
3. O sistema gera o **QR Code** único para o evento (via `EventController`).

### D. Experiência do Cliente (Paywall → LGPD → Download)

1. Cliente acessa `/e/:id` via QR Code.
2. **LGPD**: Aceite obrigatório de Termos e Privacidade — registrado em `acceptedTermsAt` / `acceptedPrivacyAt`.
3. **Paywall**: Prévia + contador de urgência → Mercado Pago (Web Tokenizer v2).
4. Pós-pagamento: cliente escolhe acesso **Público** (galeria compartilhável) ou **Privado** (exclusivo, expira).

---

## 4. Módulos do Sistema

### 🔴 Admin Tower (`/admin`)

| Sub-rota | Componente | Função |
| :--- | :--- | :--- |
| `/admin` | `AdminOverview` | Dashboard rápido com KPIs da semana |
| `/admin/events` | `AdminEvents` | CRUD completo de eventos, assign de profissionais |
| `/admin/quotes` | `AdminQuotes` | Gestão de orçamentos, precificação |
| `/admin/users` | `AdminUsers` | Gestão de usuários e roles |
| `/admin/finance` | `AdminFinance` | Relatórios de payout semanal |
| `/admin/orders` | `AdminOrders` | Histórico de pedidos |
| `/admin/suppliers` | `AdminSuppliers` | Fornecedores de impressão e break-even |
| `/admin/configs` | `AdminConfigs` | Configurações globais da plataforma |
| `/admin/services` | `AdminServices` | Gestão de serviços oferecidos |
| `/admin/contests` | `AdminContests` | Concursos de gamificação |

### 🔵 Painel do Profissional (`/profissional`) — V2.0

- **Minha Agenda**: Eventos aceitos, com cronômetros de prazo de entrega.
- **Convites Pendentes**: Novos serviços aguardando aceite/recusa.
- **Perfil Técnico**: Equipamentos, habilidades (FOTO/VÍDEO/EDIÇÃO), skills complementares.
- **Falar com Matriz**: Link direto WhatsApp para suporte da Matriz.

### 🟢 Painel da Unidade Fixa (`/unidade-fixa`)

- QR Code dinâmico para displays físicos.
- Landing page própria da unidade (`/unidade-fixa/:slug`).
- Estatísticas de leads originados na unidade.

### 🟣 Área do Cliente (`/minha-conta`)

- Galeria de ativos com download direto.
- Gamificação: sistema de pontos trocáveis por fotos impressas.
- Gestão de consentimento LGPD.

---

## 5. API Reference (Endereços Principais)

### Autenticação

| Método | Endpoint | Acesso |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Público |
| `POST` | `/api/auth/register` | Público |

### Profissional (NOVO em V2.0)

| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/profissional/events` | Lista eventos do profissional logado | PROFISSIONAL |
| `PATCH` | `/api/profissional/events/:id/links` | Atualiza links de entrega | PROFISSIONAL |
| `PATCH` | `/api/profissional/events/:id/cover` | Upload da capa (base64) | PROFISSIONAL |
| `PATCH` | `/api/profissional/events/:id/respond` | Aceita ou recusa convite | PROFISSIONAL |
| `GET` | `/api/profissional/me` | Retorna perfil técnico | PROFISSIONAL |
| `PATCH` | `/api/profissional/me` | Atualiza perfil (equipamentos, skills) | PROFISSIONAL |

### Financeiro

| Método | Endpoint | Acesso |
| :--- | :--- | :--- |
| `POST` | `/api/admin/payouts/generate` | Gera relatório semanal | ADMIN |
| `GET` | `/api/admin/payouts` | Lista todos os payouts | ADMIN |
| `PATCH` | `/api/admin/payouts/:id/items/:itemId/paid` | Marca item como pago via PIX | ADMIN |

### Gamificação

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `POST` | `/api/events/:slug/photos/like` | Curte uma foto |
| `GET` | `/api/events/:slug/photos/likes` | Lista curtidas do evento |
| `GET` | `/api/me/points` | Saldo de pontos do cliente |
| `POST` | `/api/me/redeem-print` | Resgata pontos por fotos impressas |

---

## 6. Schema do Banco: Modelos Chave

### `Event` — campos adicionados em V2.0

```prisma
captacaoStatus  AcceptanceStatus  @default(PENDING)
edicaoStatus    AcceptanceStatus  @default(PENDING)
```

```prisma
enum AcceptanceStatus {
  PENDING    // Convite enviado, aguardando resposta
  ACCEPTED   // Profissional confirmou presença
  REJECTED   // Profissional recusou
}
```

### `Profissional`

```prisma
model Profissional {
  services         String[]   // ["FOTO", "VÍDEO", "EDIÇÃO"]
  cameras          String[]
  lenses           String[]
  lighting         String[]
  equipment        String?    // Equipamento principal (texto livre)
  otherHabilities  String?    // Skills complementares
  captPct          Float      // % de comissão por captação
  editPct          Float      // % de comissão por edição
}
```

### Padrão "Snapshot" de Comissão

No momento da compra, os splits são calculados e **gravados como valores fixos** em `Order.splitMatriz / splitCaptacao / splitEdicao / splitCartorio`. Mudanças futuras nas taxas não afetam pedidos retroativos.

---

## 7. Infra e Deploy

### Variáveis de Ambiente Obrigatórias (`.env`)

| Variável | Onde usar | Descrição |
| :--- | :--- | :--- |
| `DATABASE_URL` | Backend + Prisma | Transaction Pooler (Supabase) |
| `DIRECT_URL` | Migrations/Scripts | Conexão direta ao PostgreSQL |
| `JWT_SECRET` | Backend | Assina tokens de sessão |
| `SUPABASE_URL` | Backend | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Upload de arquivos no Storage |
| `MP_ACCESS_TOKEN` | Backend | Mercado Pago produção |
| `VITE_API_URL` | Frontend | URL da API (ex: `https://foto-segundo.vercel.app/api`) |

### Deploy Automático

Cada push para `main` no GitHub dispara o build na Vercel. O script de build roda `prisma generate` automaticamente antes de compilar o backend.

**Para rodar migrações em produção:**
```bash
# Use SEMPRE a DIRECT_URL
cross-env DATABASE_URL="<DIRECT_URL>" npx prisma db push
```

---

## 8. Regras Inegociáveis

> [!IMPORTANT]
> A estética **Midnight Luxury** é inegociável. Cada elemento deve parecer uma joia. Cor de marca: `#85B9AC`. Background: entre `#0a0a0a` e `#111`. Fonte: **Outfit** (Google Fonts). Qualquer cor fora do padrão deve ser corrigida antes de qualquer outra tarefa.

> [!WARNING]
> **Nunca use `DATABASE_URL` apontando para o banco direto em código de produção.** O PgBouncer (Transaction Pooler) é obrigatório para o ambiente serverless da Vercel evitar esgotamento de conexões.

> [!NOTE]
> O sistema de **self-healing auth** no `AuthController.login` corrige UIDs silenciosamente mas **nunca altera a `role`** do usuário. Qualquer mudança de role deve ser feita via script administrativo ou pelo Admin Tower. As referências visuais a 'Cartório' agora são padronizadas como **'Unidade Fixa'**.
