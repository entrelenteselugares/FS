# Testing Strategy: Foto Segundo

## Automated E2E (Playwright)

- **Master Suite**: 22 parallel tests covering 100% of the core user journey.
- **Coverage**:
  - Registration & Auth.
  - Event Creation & Professional Assignment.
  - B2C Checkout (Credit Card/PIX).
  - B2B Supply Reordering.
  - Ponto Fixo "One-Click" Sales.
  - Phygital Print Spooling.

## Manual UAT

- Verified by Kurio in production-like environments.
- Stress testing via multi-browser parallel execution.

## Quality Gates

- All major phases (Milestones) require a full regression pass of the Master Suite.
- Zero-tolerance policy for financial logic errors (Split, Payout, Cashback).

## Testing Tools

- **Playwright**: Browser-based automation.
- **Prisma Studio**: Direct database state verification.
- **Audit Logs**: Traceability for transaction failures.
