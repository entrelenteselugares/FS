# API Reference & Database Deep Dive: Foto Segundo (V2.0)

> **Última revisão:** Abril / 2026
> **Status:** Estabilidade V2.0 Confirmada

Este documento é o guia técnico definitivo para entender como os dados fluem entre o Frontend e o Banco de Dados através da nossa API REST.

---

## 🔐 Autenticação e Segurança

O sistema utiliza **JWT (JSON Web Tokens)** em conjunto com o **Supabase Auth**.

- **Middleware Principal**: `requireAuth` (`backend/src/lib/auth.ts`) — valida o Bearer token.
- **RBAC**: `requireRole("ADMIN", "PROFISSIONAL", ...)` — garante nível de acesso correto.
- **Trust Proxy**: Configurado em `app.ts` (`app.set("trust proxy", 1)`) para permitir detecção real de IP em ambientes Vercel.
- **Rate Limiting**: Implementado em rotas críticas (`/api/auth/*`, `/api/checkout`) para prevenir ataques de força bruta.
- **Self-Healing**: O `AuthController.login` detecta e corrige desalinhamentos de UID automaticamente.

---

## 📡 Endpoints da API

### 🔑 Autenticação e Registro

| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Login via Supabase + Sincronização Prisma | Público |
| `POST` | `/api/auth/register` | Registro via Supabase + Criação de Perfil (Unidade/Pro) | Público |

### 🌐 Público (Vitrine)

| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/public/events` | Lista eventos para a vitrine principal | Público |
| `GET` | `/api/public/partners` | Lista diretório de Unidades Fixas | Público |
| `GET` | `/api/public/unidade-fixa/:slug` | Dados da landing page da unidade (SEO/Recent Events) | Público |
| `POST` | `/api/public/quotes` | Cria um lead/orçamento de evento | Público |

### 🎛️ Admin Tower

| Método | Endpoint | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | KPIs e Visão Geral | ADMIN |
| `GET` | `/api/admin/events` | Gestão de Eventos | ADMIN |
| `PATCH` | `/api/admin/quotes/:id/approve` | Gerencia precificação e aprovação de Leads | ADMIN |
| `GET` | `/api/admin/logs` | Trilha de Auditoria (Audit Logs) | ADMIN |

---

## 🗄️ Banco de Dados: Modelos Principais

### Modelo `AuditLog` (Trilha de Auditoria)

Para manter compatibilidade com o schema e flexibilidade, utilizamos um campo `details` serializado.

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String   // Ex: LOGIN, EVENT_DELETED, QUOTE_APPROVED
  details   String?  // JSON serializado contendo entityType, entityId, oldValue, newValue, ip
  createdAt DateTime @default(now())
}
```

> [!IMPORTANT]
> **Protocolo de Escrita**: Sempre use o helper `audit(req, action, entityType, ...)` para garantir que o IP seja extraído corretamente via Proxy Headers e os dados sejam serializados em `details`.

### Modelo `Cartorio` (Unidade Fixa)

```prisma
model Cartorio {
  userId      String   @unique
  razaoSocial String
  slug        String?  @unique // Identificador para a Landing Page Pública
  splitPct    Float    @default(10)
  address     String?  // ViaCEP consolidado
  cidade      String?  // Indexado para vitrine
}
```

---

## 🛠️ Regras de Endereço Automático (ViaCEP)

1. **Input**: CEP (8 dígitos).
2. **API**: `https://viacep.com.br/ws/${cep}/json/`.
3. **Consolidação**: O frontend concatena dados para `address`, enquanto salva a `cidade` separadamente para indexação na vitrine pública.

---

## 🚀 Checklist de QA e Payout

1. **Rastreabilidade**: Toda ação Admin deve gerar um `AuditLog` visível no banco.
2. **Branding**: O termo "Cartório" é estritamente proibido na interface; use "Unidade Fixa".
3. **Segurança**: Testar o Rate Limiting em `/api/checkout` para garantir proteção contra disparos em massa.
