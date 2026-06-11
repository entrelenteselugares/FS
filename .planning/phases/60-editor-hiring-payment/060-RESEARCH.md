# Phase 060: Editor Hiring & Payment Flow — Research

## Context

The goal is to allow event owners to hire a post-production editor directly within the Delivery Panel (Team tab), select their services, and pay using MercadoPago or existing Wallet Credits (`rewardCredits`). This initiates a structured contract (escrow, revision, payout).

## Architecture & Existing Systems

### 1. Payment Methods

**MercadoPago**: We already have `MercadoPagoService` which uses `createPreference` for checkout flows and `processPayment` for direct token-based flows. Webhooks exist in `payment.controller.ts`.
**Wallet Credits**: We have a `rewardCredits` field on the `User` model, currently used for gamification and affiliate payouts. We can increment/decrement this value.

### 2. Data Models

We need a new model `EditorContract` as specified in the context:

- References `Event`, `Editor` (User), `Owner` (User), `ProfessionalService`.
- Tracks `status`, `amounts` (gross, platform fee, net), and dates.

### 3. Sub-Systems

- **Notifications**: `notification.service.ts` supports WhatsApp (`notifyNewSale`, `sendLoyaltyMessage`), email (`getTransporter`), and in-app (`createInApp`). We'll need new notifications for:
  - Contract proposed
  - Contract accepted/rejected
  - Contract delivered
  - Funds released
- **ProfessionalService**: Already exists, tracks `price`, `pricingType`, `active`, etc.

## Proposed Flow

1. **Owner UI (EventEditPanel.tsx)**:
   - When viewing an Editor's profile in the team tab, fetch their active `ProfessionalService` items.
   - User selects a service, clicks "Hire".
   - A modal allows payment selection: "Pay with MercadoPago" or "Pay with Credits (Bal: R$ X)".
   - On submission, POST to `/api/professional/contracts`.

2. **Backend Contract Creation**:
   - Create `EditorContract` with `status: PENDING_ACCEPTANCE`.
   - If Credits: Verify balance, decrement, and create a `CreditTransaction` (or `GamificationLedger` entry) to track usage.
   - If MercadoPago: Generate preference URL and return it. The frontend redirects. On webhook success, mark `status: PENDING_ACCEPTANCE`.

3. **Editor Acceptance**:
   - Editor sees pending contracts in their dashboard.
   - Can "Accept" (moves to `IN_PROGRESS`) or "Reject" (cancels, refunds credits or MercadoPago).
   - If not accepted within 48h, a CRON job or on-access check automatically cancels it.

4. **Delivery & Escrow**:
   - Editor clicks "Mark as Delivered" -> status `DELIVERED`.
   - Owner can click "Request Revision" -> status `REVISION`. Editor delivers again -> `DELIVERED`.
   - After 7 days in `DELIVERED` state, a CRON job (or lazy evaluation on read) releases funds.
   - Release: Increment editor's `rewardCredits` (or trigger MercadoPago split/transfer) by `netAmount`. Change status to `COMPLETED`.

## Technical Gaps & Considerations

- **CRON Jobs**: If we don't have a reliable CRON runner, we might need a lazy-evaluation mechanism on API calls (e.g. `checkExpiredContracts()` middleware or within list endpoints), OR a Vercel Cron function.
- **Refunds**: Refunding MercadoPago can be tricky if we use checkout pro. We might need to call MP API to cancel/refund payment. With credits, it's just incrementing the balance back.
- **Schema Push**: Adding `EditorContract` will require a Prisma DB push (`npx prisma db push`).
