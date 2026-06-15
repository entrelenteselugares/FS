# Phase 74: Segurança e Proteção Financeira - Plan

## Proposed Changes

### Database

- Modify `prisma/schema.prisma` to add `hasActiveDispute Boolean @default(false)` to `ServiceBooking`.
- Run migrations: `npx prisma migrate dev --name add_dispute_flag_to_bookings`

### Backend

- Update `backend/src/controllers/phygital.controller.ts` replacing hardcoded key with `process.env.STRESS_TEST_KEY`.
- Update `backend/src/services/pricing.service.ts` enforcing `MATRIZ_FLOOR_PCT = 0.05`.
- Update `backend/src/jobs/escrow-release.job.ts` to include `hasActiveDispute: false` check.

## Verification

- Validate the schema migration is completed and applied.
- Run tests on splits calculations and simulation routing.
