# API Reference & Database Deep Dive: Foto Segundo (V2.0)

> **Última revisão:** Abril / 2026

Este documento é o guia técnico definitivo para entender como os dados fluem entre o Frontend e o Banco de Dados através da nossa API REST.

---

## 🔐 Autenticação e Segurança

O sistema utiliza **JWT (JSON Web Tokens)** em conjunto com o **Supabase Auth**.

- **Middleware Principal**: `requireAuth` (`backend/src/lib/auth.ts`) — valida o Bearer token.
- **RBAC**: `requireRole("ADMIN", "PROFISSIONAL", ...)` — garante nível de acesso correto.
- **TypeScript**: Rotas autenticadas usam `AuthRequest`, que injeta `req.user.userId` e `req.user.role`.
- **Self-Healing**: O `AuthController.login` detecta e corrige desalinhamentos de UID automaticamente, **sem alterar roles**.

---

## 📡 Endpoints da API

### 🔑 Autenticação

| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Login por email/senha | Público |
| `POST` | `/api/auth/register` | Cadastro de novo usuário | Público |

### 🌐 Público (Vitrine)

| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/public/events` | Lista eventos para a vitrine principal | Público |
| `GET` | `/api/public/events/:id` | Detalhes do evento (com paywall dinâmico) | Público |
| `GET` | `/api/public/events/slug/:slug` | Detalhes do evento por slug | Público |
| `POST` | `/api/public/quotes` | Cria um lead/orçamento de evento | Público |
| `GET` | `/api/public/theme` | Retorna configurações de tema | Público |

### 🎛️ Admin

| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | KPIs do dashboard principal | ADMIN |
| `GET` | `/api/admin/events` | Lista todos os eventos | ADMIN |
| `POST` | `/api/admin/events` | Cria evento | ADMIN |
| `PATCH` | `/api/admin/events/:id` | Atualiza evento (preços, capas, assigns) | ADMIN |
| `DELETE` | `/api/admin/events/:id` | Remove evento | ADMIN |
| `GET` | `/api/admin/users` | Lista usuários | ADMIN |
| `POST` | `/api/admin/users` | Cria usuário com role definida | ADMIN |
| `PATCH` | `/api/admin/users/:id` | Atualiza usuário | ADMIN |
| `GET` | `/api/admin/orders` | Lista pedidos | ADMIN |
| `GET` | `/api/admin/quotes` | Lista orçamentos pendentes | ADMIN |
| `PATCH` | `/api/admin/quotes/:id/approve` | Aprova orçamento → evento | ADMIN |
| `POST` | `/api/admin/payouts/generate` | Gera relatório semanal de repasses | ADMIN |
| `GET` | `/api/admin/payouts` | Lista todos os payouts | ADMIN |
| `PATCH` | `/api/admin/payouts/:id/items/:itemId/paid` | Marca item de repasse como pago | ADMIN |
| `GET` | `/api/admin/logs` | Trilha de auditoria | ADMIN |
| `GET` | `/api/admin/configs` | Configurações da plataforma | ADMIN |
| `PATCH` | `/api/admin/configs` | Atualiza configurações | ADMIN |

### 📸 Profissional — V2.0

| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/profissional/events` | Lista eventos atribuídos (todos os status) | PROFISSIONAL |
| `PATCH` | `/api/profissional/events/:id/links` | Atualiza links de entrega (galeria, drive) | PROFISSIONAL |
| `PATCH` | `/api/profissional/events/:id/cover` | Upload de capa via base64 | PROFISSIONAL |
| `PATCH` | `/api/profissional/events/:id/respond` | Aceita ou recusa convite de serviço | PROFISSIONAL |
| `GET` | `/api/profissional/me` | Retorna dados do perfil técnico | PROFISSIONAL |
| `PATCH` | `/api/profissional/me` | Atualiza perfil (equipment, skills) | PROFISSIONAL |

**Payload de `/respond`:**
```json
{ "status": "ACCEPTED" }
// ou
{ "status": "REJECTED" }
```

### 🛒 Checkout e Vendas

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `POST` | `/api/checkout` | Inicia checkout via Mercado Pago |
| `POST` | `/api/checkout/payment` | Processa pagamento transparente |
| `POST` | `/api/webhooks/mercadopago` | Webhook de atualização de status |

### 🎮 Gamificação

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `POST` | `/api/events/:slug/photos/like` | Curte uma foto do evento |
| `GET` | `/api/events/:slug/photos/likes` | Lista curtidas do evento |
| `GET` | `/api/me/points` | Saldo de pontos do cliente |
| `POST` | `/api/me/redeem-print` | Resgata pontos por fotos impressas |

### 🏪 Parceiros / Cartório

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/parceiro/:slug` | Dados da landing page do parceiro |
| `PATCH` | `/api/cartorio/profile` | Atualiza perfil da unidade |

---

## 🗄️ Banco de Dados: Modelos Principais

### Enum: `AcceptanceStatus` — NOVO V2.0

```prisma
enum AcceptanceStatus {
  PENDING    // Convite enviado, aguardando resposta
  ACCEPTED   // Profissional confirmou
  REJECTED   // Profissional recusou
}
```

Aplicado em `Event.captacaoStatus` e `Event.edicaoStatus`.

### Enum: `Role`

```
ADMIN | PROFISSIONAL | CARTORIO | CLIENTE
```

### Modelo `Event` — campos de atribuição

```prisma
captacaoId      String?
captacaoStatus  AcceptanceStatus @default(PENDING)
edicaoId        String?
edicaoStatus    AcceptanceStatus @default(PENDING)
cartorioUserId  String?
```

### Modelo `Profissional`

```prisma
services         String[]   // ["FOTO", "VÍDEO", "EDIÇÃO"]
cameras          String[]
lenses           String[]
lighting         String[]
equipment        String?    // Campo texto livre para equipamento principal
otherHabilities  String?    // Skills complementares (texto livre)
captPct          Float      // % comissão captação
editPct          Float      // % comissão edição
```

### Padrão "Snapshot" de Comissão

No momento da compra, os splits são calculados e gravados como **valores fixos** em `Order`:

```prisma
splitMatriz   Decimal?
splitCartorio Decimal?
splitCaptacao Decimal?
splitEdicao   Decimal?
```

Mudanças futuras nas taxas **não afetam** pedidos já realizados.

### Conformidade LGPD

O modelo `User` registra o consentimento explícito:

```prisma
acceptedTermsAt   DateTime?
acceptedPrivacyAt DateTime?
```

---

## 🛠️ Variáveis de Ambiente

| Variável | Ambiente | Descrição |
| :--- | :--- | :--- |
| `DATABASE_URL` | Backend produção | Transaction Pooler — Supabase |
| `DIRECT_URL` | Scripts / migrations | Conexão direta ao PostgreSQL |
| `JWT_SECRET` | Backend | Assina tokens JWT |
| `SUPABASE_URL` | Backend | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Upload no Supabase Storage |
| `MP_ACCESS_TOKEN` | Backend | Token de produção Mercado Pago |
| `VITE_API_URL` | Frontend | URL da API em produção |
| `CRON_SECRET` | Infra | Autenticação do job de expiração diário |

> [!WARNING]
> Nunca aponte `DATABASE_URL` para o banco direto em produção. O PgBouncer é obrigatório para o ambiente serverless da Vercel.

---

## 🚀 Checklist de Teste

1. **Fluxo de Compra**: Use cartões de sandbox do Mercado Pago.
2. **Sistema de Convites**: Atribua um profissional a um evento no Admin e verifique a aba "Convites Pendentes" no painel `/profissional`.
3. **Edição de Perfil**: Abra o modal de perfil técnico e salve equipamentos.
4. **QR Code**: Gere no Admin e aponte câmera → deve ir para `/e/:id`.
5. **Expiração LGPD**: Altere `accessExpiresAt` de uma `Order` para o passado e verifique o banner de alerta no painel do cliente.
6. **Payout**: Crie 3 pedidos aprovados e rode `POST /api/admin/payouts/generate`.
