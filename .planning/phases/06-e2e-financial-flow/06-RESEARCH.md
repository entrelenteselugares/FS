# Phase 06: Financial Security - Research

**Date:** 2026-05-03

## 1. Codebase Analysis: Current Financial Infrastructure

### 1.1. Models (prisma/schema.prisma)
- `User`: Currently has basic roles. Needs `isVerified` (Boolean), `verificationStatus` (Enum), and `verificationDocs` (Json/String).
- `Order`: Has `splitMatriz`, `splitCaptacao`, etc. Needs `payoutStatus` (Enum: PENDING, AVAILABLE, PAID), `escrowExpiresAt` (DateTime), and `payoutReadyAt` (DateTime).
- `WeeklyPayout`: Already exists but seems to be a batch process. We need a more real-time "Pending Payout" view for individual orders or a per-photographer balance.

### 1.2. Payment Logic (backend/src/controllers/payment.controller.ts)
- We need to find the logic that calculates `split_items` for Mercado Pago.
- Logic to inject:
  ```typescript
  if (!photographer.isVerified || order.amount > 5000) {
    // Hold the photographer's part in the platform's account
    // This is done by NOT sending the split for the photographer in the MP request
    // and marking the order for manual payout.
  }
  ```

### 1.3. Admin Views (frontend/src/pages/admin/)
- `AdminFinance.tsx`: Likely candidates for the new payout queue.
- `AdminUsers.tsx` or `AdminEvents.tsx`: For approving photographers.

## 2. Technical Approach: Risk-Aware Splits

### 2.1. Verification (PRO Status)
- Implementation of a simple KYC submission in the photographer dashboard.
- Admin review screen in `AdminUsers.tsx` to toggle `isVerified`.

### 2.2. Escrow Management
- Scheduled task (Cron) to move `escrow` orders to `AVAILABLE` status once `escrowExpiresAt < now`.
- Alternatively, a dynamic query in the Admin view that filters orders where `hasPaid = true` AND `payoutStatus = PENDING` AND `eventDate + 7 days < now`.

## 3. Security Considerations
- Malicious users could try to fake "Event Completion". We should tie release to the `dataEvento` + 7 days.
- Ensure that `mpAccessToken` and other sensitive financial data remain protected (already encrypted).

## 4. Dependencies
- No new dependencies needed. We'll use existing Prisma and Mercado Pago integration.
