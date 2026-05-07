# Phase 06: Financial Security - Validation Strategy

**Date:** 2026-05-03

## 1. Unit Testing (Backend)

- **Split Logic:** Test `PaymentController` with different user statuses (PRO vs Regular) and amounts.
- **Escrow Trigger:** Verify that `escrowExpiresAt` is calculated correctly based on `eventDate`.
- **PRO Transition:** Test the transition logic for `isVerified` based on order count.

## 2. Integration Testing

- **Mercado Pago Simulation:** Ensure that for non-PRO users, the split is NOT sent to the partner's account in the MP request.
- **Order State Machine:** Verify that orders move from `PAID` to `AVAILABLE_FOR_PAYOUT` after the safety window.

## 3. UI/UX Validation (Admin)

- **Payout Queue:** Verify that the "Pending Payouts" list correctly filters only orders that are ready to be paid.
- **Manual Settlement:** Verify that clicking "Mark as Paid" updates the database and hides the item from the queue.

## 4. Security Audit

- Verify that a photographer cannot manually trigger their own payout release.
- Verify that transaction limits (R$ 5.000) are enforced server-side.
