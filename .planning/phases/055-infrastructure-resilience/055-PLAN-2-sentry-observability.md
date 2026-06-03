---
phase: 55
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/index.ts
  - frontend/src/main.tsx
  - backend/.env.example
  - frontend/.env.example
autonomous: true
requirements: []
---

<objective>
Instalar Sentry no backend (Node.js) e no frontend (React), com alertas configurados para error rate no webhook de pagamento.

Atualmente o sistema usa apenas `console.log` para erros em produção. Quando o banco trava às 22h de sábado, ninguém sabe até o suporte acordar no domingo. Esta fase instala Sentry com configuração mínima funcional e documenta os alertas críticos a configurar no dashboard.
</objective>

<threat_model>

## Threat Model

| Ameaça                                   | Severidade | Mitigação                                                                                       |
| ---------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| DSN do Sentry exposto no frontend bundle | BAIXA      | DSN de frontend é projetado para ser público (Sentry design); não contém credenciais de escrita |
| PII (dados pessoais) enviado para Sentry | MÉDIA      | Configurar `beforeSend` para remover `req.body` em rotas de pagamento e upload                  |

</threat_model>

<tasks>

<task id="55.2.1">
<title>Instalar e inicializar Sentry no Backend (Node.js)</title>
<type>execute</type>
<read_first>
- backend/src/index.ts (ponto de entrada — onde Sentry deve ser inicializado ANTES de qualquer require/import)
- backend/package.json (verificar se @sentry/node já existe)
</read_first>
<action>
Instalar: `npm install @sentry/node --save` no diretório `backend/`

No topo de `backend/src/index.ts`, ANTES de qualquer outro import de módulo próprio:

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN_BACKEND,
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  beforeSend(event) {
    // Remove dados sensíveis de rotas de pagamento
    if (event.request?.url?.includes("/webhooks/mercadopago")) {
      if (event.request.data) {
        event.request.data = "[REDACTED]";
      }
    }
    return event;
  },
});
```

Após o setup do Express e ANTES do error handler final, adicionar:

```typescript
// Sentry error handler — DEVE vir após todas as rotas e ANTES do handler 500 padrão
Sentry.setupExpressErrorHandler(app);
```

</action>
<acceptance_criteria>
- `backend/package.json` contém `"@sentry/node"`
- `backend/src/index.ts` contém `import * as Sentry from '@sentry/node'`
- `backend/src/index.ts` contém `Sentry.init({`
- `backend/src/index.ts` contém `SENTRY_DSN_BACKEND`
- `backend/src/index.ts` contém `Sentry.setupExpressErrorHandler`
- `npx tsc --noEmit` no backend retorna exit code 0
</acceptance_criteria>
</task>

<task id="55.2.2">
<title>Instalar e inicializar Sentry no Frontend (React/Vite)</title>
<type>execute</type>
<read_first>
- frontend/src/main.tsx (ponto de entrada React — onde Sentry deve ser inicializado)
- frontend/package.json (verificar se @sentry/react já existe)
</read_first>
<action>
Instalar: `npm install @sentry/react --save` no diretório `frontend/`

No topo de `frontend/src/main.tsx`, ANTES do `ReactDOM.createRoot`:

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: import.meta.env.MODE === "production" ? 0.05 : 1.0,
  integrations: [Sentry.browserTracingIntegration()],
});
```

</action>
<acceptance_criteria>
- `frontend/package.json` contém `"@sentry/react"`
- `frontend/src/main.tsx` contém `import * as Sentry from '@sentry/react'`
- `frontend/src/main.tsx` contém `Sentry.init({`
- `frontend/src/main.tsx` contém `VITE_SENTRY_DSN`
- `npx tsc --noEmit` no frontend retorna exit code 0
</acceptance_criteria>
</task>

<task id="55.2.3">
<title>Atualizar .env.example com variáveis Sentry</title>
<type>execute</type>
<read_first>
- backend/.env.example
- frontend/.env.example (se existir)
</read_first>
<action>
Adicionar ao final de `backend/.env.example`:
```env
# ============================================================
# SENTRY — Error Tracking & Alerting
# Obtenha em: sentry.io → Settings → Projects → Client Keys (DSN)
# CRÍTICO: Configurar alertas no dashboard do Sentry:
#   1. Error rate > 1% em /api/webhooks/mercadopago → Alert Rule → Email/PagerDuty
#   2. Error rate > 5% em qualquer rota → Alert Rule → Slack/Email
#   3. P95 latency > 2000ms em /api/vaults/*/upload → Performance Alert
# ============================================================
SENTRY_DSN_BACKEND=
```

Adicionar ao `frontend/.env.example` (criar se não existir):

```env
# Sentry Frontend — DSN é seguro para ser público (read-only por design do Sentry)
VITE_SENTRY_DSN=
```

</action>
<acceptance_criteria>
- `backend/.env.example` contém `SENTRY_DSN_BACKEND=`
- `backend/.env.example` contém comentário sobre configurar alertas no dashboard
- Arquivo `frontend/.env.example` existe
- `frontend/.env.example` contém `VITE_SENTRY_DSN=`
</acceptance_criteria>
</task>

</tasks>

<verification>

## Verification

1. `backend/package.json` lista `@sentry/node` como dependência
2. `frontend/package.json` lista `@sentry/react` como dependência
3. `backend/src/index.ts` possui `Sentry.init` antes de qualquer rota
4. `frontend/src/main.tsx` possui `Sentry.init` antes do ReactDOM.createRoot
5. `npx tsc --noEmit` no backend retorna exit code 0
6. `npx tsc --noEmit` no frontend retorna exit code 0
7. `backend/.env.example` e `frontend/.env.example` contêm as variáveis Sentry
   </verification>

<success_criteria>

- Sentry inicializado em ambos backend e frontend sem erros de compilação
- `.env.example` documenta as variáveis e inclui instruções para configurar alertas no dashboard
- `beforeSend` no backend remove dados sensíveis de rotas de pagamento antes de enviar para Sentry
  </success_criteria>

## PLANNING COMPLETE
