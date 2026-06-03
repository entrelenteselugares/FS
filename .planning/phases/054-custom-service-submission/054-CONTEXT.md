# Phase 54: Custom Service Submission by Professionals & Fixed Points

**Date:** 2026-05-23  
**Status:** Context Gathered — Ready for Planning

---

## Domain

Allow verified Professionals (PROFISSIONAL) and Fixed Points (CARTORIO/UNIDADE) with `verificationStatus = APPROVED` to create custom services via a dedicated full-form page.
Admin receives notification (in-app + email) and evaluates each submission in a new "Pendentes" tab under Admin > Catálogo de Serviços. Admin decides: **Publicar na Rede / Manter Exclusivo / Recusar / Solicitar Ajustes**. Creator is notified of the outcome via in-app + email (with reason when Recusado or Ajuste Solicitado).

---

## Canonical Refs

- `backend/src/controllers/service_catalog.controller.ts` — existing admin CRUD for ServiceCatalog
- `backend/prisma/schema.prisma` — ServiceCatalog model (lines 413–430), ProfessionalService model (lines 432–448), Notification model (lines 637–652)
- `backend/src/controllers/auth.controller.ts` — /me endpoint
- `backend/src/services/notification.service.ts` — NotificationService for in-app and email alerts
- `frontend/src/pages/ClienteArea.tsx` — profissional tab "Portfólio & Serviços" (where the "+" button lives)
- `backend/src/routes/index.ts` — all API route definitions

---

## Decisions

### Access Control

- **Who can create:** Only `PROFISSIONAL` + `CARTORIO` + `UNIDADE` users with `verificationStatus === "APPROVED"`
- **Gatekeeping:** Backend must enforce this via `requireAuth` + role/verification check

### Submission UX (Professional side)

- **Entry point:** Existing "Portfólio & Serviços" tab in `/minha-conta` → add `+ Criar Serviço Personalizado` button at the top of "Meus Serviços" section
- **Form:** Full-page dedicated form (NOT a modal) with these fields:
  - Nome do Serviço (required)
  - Descrição (required — used to justify relevance for the network)
  - Categoria (dropdown: FOTOGRAFIA, VIDEO, EDICAO, IMPRESSAO, OUTRO)
  - Preço Base (required)
  - Duração Estimada em minutos (optional)
  - Justificativa para a Rede (textarea: "Por que este serviço deveria estar no catálogo geral?")
- **No choice at submission time:** The creator does NOT choose if it goes to the network — the admin decides 100%

### Service State After Submission (Professional side)

- Service becomes **ACTIVE for the creator immediately** after submission (they can use it in their own events)
- Badge/tag: **"🔄 Pendente de Avaliação"** shown on the card in their services list
- If admin → "Manter Exclusivo": badge changes to **"✅ Exclusivo"**
- If admin → "Publicar na Rede": service migrates to the global `ServiceCatalog` (or flags `isApprovedNetwork=true` on `ProfessionalService`) + badge changes to **"🌐 Na Rede"**
- If admin → "Recusar": service is deactivated, badge changes to **"❌ Recusado"**, reason shown
- If admin → "Solicitar Ajustes": badge changes to **"✏️ Ajustes Solicitados"**, reason shown, edit button unlocked

### Schema Changes Required

Add fields to `ProfessionalService` model:

- `submittedAt DateTime?` — when sent for review
- `reviewStatus String @default("PENDING_REVIEW")` — PENDING_REVIEW | EXCLUSIVE | NETWORK | REJECTED | NEEDS_ADJUSTMENT
- `reviewNote String?` — admin's reason for rejection or adjustment request
- `networkJustification String?` — creator's justification text
- `submittedByUserId String` — which user submitted (for cartorio/unidade cases where they don't have Profissional profile)

### Visual Separation (Professional's Screen)

- Section 1 → **"Meus Serviços"** (top): shows `ProfessionalService` records with their review badges
- Section 2 → **"Catálogo da Rede"** (bottom): shows global `ServiceCatalog` with IMPORTAR button (existing behavior)
- Both sections on the same screen — no new tab

### Admin Review Flow

- **Location:** Admin panel → Catálogo de Serviços → new tab **"Pendentes ({count})"**
- Shows a list of submitted services with: creator name, service details, justification, submission date
- Four action buttons per item: **Publicar na Rede** / **Manter Exclusivo** / **Solicitar Ajustes** (requires reason field) / **Recusar** (requires reason field)
- Badge/count on the tab updates in real-time

### Notification Flow

- **Admin receives:**
  - In-app notification: `"Novo serviço submetido por [nome]: [service name]"` → deep link to admin pending tab
  - Email to admin: subject `"[FS] Novo serviço aguarda avaliação"`, body includes service details + justification
- **Creator receives (after admin decision):**
  - In-app notification: different message per outcome (Aprovado para Rede / Mantido Exclusivo / Recusado + reason / Ajuste Solicitado + reason)
  - Email with the same information + action link if "Ajuste Solicitado"

### "Publicar na Rede" Mechanics

- Option A (Recommended): Create a new `ServiceCatalog` record mirroring the `ProfessionalService`, set `reviewStatus = "NETWORK"` on the original. The original ProfessionalService stays for the creator, the catalog entry is visible to all.
- The admin can edit the catalog name/price before publishing (normalization).

---

## Scope Boundary

**In scope:**

- Form page for service submission
- Schema migration (new fields on ProfessionalService)
- New API endpoints: POST /profissional/services (create), PATCH /profissional/services/:id (edit when NEEDS_ADJUSTMENT), GET /admin/services/pending, PATCH /admin/services/:id/review
- Admin UI tab "Pendentes" in existing Catálogo de Serviços admin area
- Notifications (in-app + email) for both admin and creator
- Visual section split in profissional dashboard

**Deferred (not in this phase):**

- Service booking/scheduling flow (separate capability)
- Pricing negotiation between admin and creator
- Analytics on service popularity
