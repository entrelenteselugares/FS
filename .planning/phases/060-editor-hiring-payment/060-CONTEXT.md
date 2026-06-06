# Phase 60 — Editor Hiring & Payment Flow
_Context captured: 2026-06-06_

## Domain
Enable the event owner to hire a post-production editor directly inside the Delivery Panel (Equipe tab), selecting the editor's services, paying (via Mercado Pago or wallet credits), and triggering a structured contract with acceptance window, escrow hold, revision right, and commission split.

---

## Decisions

### Contract Model
- **Type:** Hybrid — editors register their own services with pricing type (FIXED, HOURLY, PER_UNIT) via `ProfessionalService` model (already in DB)
- **Flow trigger:** Inside EventEditPanel → Aba Equipe → after selecting editor, services and prices are displayed inline

### Acceptance Window
- **Editor must accept within 48h** before payment is processed
- If editor does not accept in 48h → contract auto-cancelled, no charge
- State machine: `PENDING_ACCEPTANCE → ACCEPTED → PAID → IN_PROGRESS → DELIVERED → REVISION → COMPLETED`

### Escrow & Release
- Payment is held in escrow upon editor acceptance
- Released **7 days after editor marks as delivered**
- Owner has right to **1 revision** during those 7 days (for basic changes)
- Revision resets the 7-day timer once

### Platform Commission
- Platform retains a configurable % (start at 10–15%) of the gross value
- Net amount released to editor after commission deduction
- Commission stored in a new `EditorContract` model

### Payment Methods
- Mercado Pago checkout (existing `mercadopago.service.ts`)
- Wallet credits: `rewardCredits` (cashback) + future photo sale earnings on `User` model
- UI shows both options, user selects one

### Notifications
- **Editor notified** (email + in-app + WhatsApp if available) when hired and pending acceptance
- **Owner notified** (in-app) when editor accepts or rejects
- **Owner notified** (in-app) when editor marks delivery
- **Editor notified** (in-app + email) when funds are released

### UI Location
- All inside `EventEditPanel.tsx` → Aba "Equipe"
- After selecting an editor, show their services list inline
- User selects service → modal/accordion expands with payment step (MP checkout or "Usar Créditos")
- Status badge shows current contract state on the Equipe tab

---

## New Data Model Required

```
EditorContract {
  id           String   @id
  eventId      String   // FK Event
  editorId     String   // FK User (editor)
  ownerId      String   // FK User (owner)
  serviceId    String   // FK ProfessionalService
  grossAmount  Decimal
  platformFee  Decimal
  netAmount    Decimal
  status       EditorContractStatus  // PENDING_ACCEPTANCE | ACCEPTED | PAID | IN_PROGRESS | DELIVERED | REVISION | COMPLETED | CANCELLED
  acceptedAt   DateTime?
  deliveredAt  DateTime?
  releasedAt   DateTime?
  revisionNote String?
  revisionAt   DateTime?
  paymentMethod String  // MP | CREDITS
  mpOrderId    String?
  createdAt    DateTime
  updatedAt    DateTime
}
```

---

## Canonical Refs
- `backend/prisma/schema.prisma` — ProfessionalService, User.rewardCredits, Order, Notification models
- `backend/src/services/notification.service.ts` — createInApp, sendWhatsAppToClient, notifyProfessionalNewAssignment patterns
- `backend/src/services/mercadopago.service.ts` — existing checkout flow
- `backend/src/services/gamification.service.ts` — rewardCredits increment/decrement pattern
- `frontend/src/components/profissional/EventEditPanel.tsx` — UI target component

---

## Deferred Ideas
- Rating/review system for editor after contract completion (own phase)
- Editor portfolio visible inside hiring flow (already exists in Phase 47 portfolio galleries)
- Dispute resolution system (mediation) — future

---

## Next Steps
```
/gsd-plan-phase 60
```
