# Phase 06: Financial Security - Plan

**Goal:** Implement photographer verification (PRO), escrow retention logic, and admin payout management.

## Wave 1: Database & Backend Logic
- [ ] **DB Update:** Add `isVerified` (Boolean), `verificationDocs` (Json) to `User` model.
- [ ] **DB Update:** Add `payoutStatus` (Enum), `escrowExpiresAt` (DateTime) to `Order` model.
- [ ] **Migration:** Run `npx prisma migrate dev` to apply changes.
- [ ] **Split Engine:** Modify `payment.controller.ts` to check `user.isVerified` and `order.amount`. If high risk, hold split by omitting partner's split in the Mercado Pago request.
- [ ] **Order Finalization:** Ensure that upon successful payment webhook, `escrowExpiresAt` is set to `event.dataEvento + 7 days`.

## Wave 2: Admin Security & Verification
- [ ] **Admin Users UI:** Add a "Verify Photographer" action to the user management screen.
- [ ] **Admin Finance UI:** Create a "Pending Payouts" table in `AdminFinance.tsx`.
  - Columns: Order ID, Event Date, Amount, Recipient, Pix Key, Status (HOLD/READY).
- [ ] **Payout Action:** Implement a `POST /admin/payouts/:id/pay` endpoint to mark an order as `PAID`.

## Wave 3: Automation & UX
- [ ] **Automatic Release:** Create a backend utility or cron job that scans for orders where `escrowExpiresAt < now` and updates status to `READY_FOR_PAYOUT`.
- [ ] **Photographer Dashboard:** Show "Pending Balance" vs "Available for Withdrawal" in the photographer's financial view.

## Verification
- [ ] Run `npm run test` (if applicable) for financial logic.
- [ ] Manual UAT: Create a payment with a non-PRO user, verify it shows in "Pending Payouts" but is not immediately split in MP.
- [ ] Manual UAT: Mark a payout as paid and verify the state change.
