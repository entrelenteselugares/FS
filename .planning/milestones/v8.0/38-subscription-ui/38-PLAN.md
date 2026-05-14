---
phase: 38
name: Subscription UI & Admin
milestone: v8.0
requirements: [UI-01, UI-02, UI-03, UI-04, ADMIN-01, ADMIN-02]
depends_on: [36, 37]
---

# Phase 38: Subscription UI & Admin

## Context
With the backend ready, we need to surface the subscription state to the user (frontend vault page, customer dashboard) and to the admin (MRR metrics, list of active subscriptions).

## Tasks

### Task 1: Admin MRR & Subscriptions API
**File:** `backend/src/controllers/finance_hub.controller.ts` (or `admin.controller.ts`)
- Add `getSubscriptionStats()`: returns total active subscriptions and MRR (`count * planPrice`).
- Route: `GET /admin/finance/subscriptions-mrr`

### Task 2: Vault Page UI Warnings & Subscribe Button
**File:** `frontend/src/pages/EventPage.tsx`
- When viewing a Vault (`FLASH_EVENT` type equivalent, but actually `album.subscriptionStatus`), check `album.subscriptionStatus` and `album.trialEndsAt`.
- If `TRIAL` and `daysLeft <= 5`, show a yellow warning banner at the top of the gallery: "Seu período gratuito acaba em X dias. Assine o cofre para manter o acesso."
- If `BLOCKED` or `EXPIRED`, hide the photos grid entirely and show a block screen: "Cofre Bloqueado. Assine para reativar."
- Implement `handleSubscribe()` that calls `POST /api/vaults/${albumId}/subscribe` and redirects the user to `initPoint`.
- Detect `?subscribed=true` in the URL (from Mercado Pago `back_url`) and show a Toast success message: "Assinatura ativada com sucesso! Seu cofre está salvo."

### Task 3: Customer Dashboard Subscriptions
**File:** `frontend/src/pages/ClienteDashboard.tsx`
- In the "Meus Cofres" section, show a badge `[TRIAL]`, `[ATIVO]`, ou `[BLOQUEADO]`.
- If Active, show the next billing date.

### Task 4: Admin Dashboard MRR Card
**File:** `frontend/src/pages/admin/AdminDashboard.tsx`
- In the Finance/Visão Geral tab, add an "MRR (Assinaturas)" card fetching from the new admin API.

## Verification
- [ ] Vault page correctly shows yellow banner for <5 days trial.
- [ ] Vault page hides photos and shows block screen when `BLOCKED`.
- [ ] Clicking "Assinar" redirects to MercadoPago checkout successfully.
- [ ] Admin dashboard shows MRR card.
