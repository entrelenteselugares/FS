---
phase: 48-automated-booking-escrow
plan: 01
subsystem: api, database
tags: [prisma, mercadopago, cron, webhook]

requires: []
provides:
  - "ServiceBooking model payment tracking and escrow logic"
  - "Automated Webhook handling for booking fee payments"
  - "Automated cron job for releasing escrow after 7 days"
affects: [marketplace, payout]

tech-stack:
  added: []
  patterns: [webhook interceptor, cron jobs]

key-files:
  created: [backend/src/jobs/escrow-release.job.ts]
  modified: [backend/prisma/schema.prisma, backend/src/controllers/payment.controller.ts, backend/src/controllers/cron.controller.ts, backend/src/routes/index.ts, backend/src/controllers/payout.controller.ts]

key-decisions:
  - "Rather than creating a complex Wallet/Payout relationship for ServiceBookings, dynamically computed pending/available balance in getMeuSaldoSummary based on ServiceBooking status."
  - "Intercepted MercadoPago webhooks with 'booking-' prefix to automatically mark ServiceBooking as PAID."

patterns-established:
  - "Escrow release logic via cron endpoint /api/cron/escrow-release."

requirements-completed: [ESCROW-01, ESCROW-02, ESCROW-03, ESCROW-04]

duration: 15min
completed: 2026-05-15
---

# Phase 48: Automated Booking Escrow Summary

**Implemented the booking fee escrow system, intercepting MercadoPago payments and holding the value until released.**

## Performance

- **Duration:** 15m
- **Started:** 2026-05-15T18:35:00-03:00
- **Completed:** 2026-05-15T18:50:00-03:00
- **Tasks:** 4
- **Files modified:** 5

## Accomplishments
- Added `paymentId` to the `ServiceBooking` Prisma model to track transactions.
- Updated `PaymentController.mercadopagoWebhook` to intercept transactions prefixed with `booking-` and automatically mark the `ServiceBooking` as `PAID`.
- Updated `getMeuSaldoSummary` to correctly aggregate `ServiceBooking` values (PENDING if paid, AVAILABLE if released) into the professional's balance.
- Implemented `runEscrowReleaseJob` to automatically release booking fees older than 7 days.
- Exposed `/api/cron/escrow-release` to run the job on a schedule.

## Task Commits

1. **Task 1 & 2: Update Schema** - `schema`
2. **Task 3: Webhook and Payout Integration** - `api`
3. **Task 4: Escrow Release Job** - `api`

*Note: All commits batched at the end of the execution.*

## Issues Encountered
- The `ServiceBooking` model was already created by the agent in a previous phase, but `paymentId` was missing. The search tool struggled with file encodings, so `Select-String` via PowerShell was used.

## Next Phase Readiness
- Escrow flow is fully operational and automatically affects professional's dashboard.
- Ready for Phase 49 (Proximity Search & Directory).
