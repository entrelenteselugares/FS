# Testing - Foto Segundo

## Frameworks
- **Backend**: Jest + Supertest (API testing).
- **Frontend**: Vitest (Planned/Partial).
- **E2E**: Playwright (Browser automation for critical flows).
- **Validation**: GSD Verify Work (Conversational UAT with persistent state).

## Test Types
- **Integration Tests**: Verification of Prisma queries and controller responses.
- **E2E Hardening**: Automated flows for professional onboarding and checkout (Playwright).
- **Hybrid Penny Testing**: Real PIX transaction validation with human interaction (Penny PIX).
- **Resilience**: Stress testing production endpoints.
- **Data Integrity**: Manual SQL audits and reset scripts.

## Running Tests
- **Backend**: `npm test --prefix backend`
- **E2E**: `npx playwright test`
- **Hybrid PIX**: `npx playwright test e2e/finance/hybrid-penny-pix.spec.ts --ui`
- **UAT**: `/gsd-verify-work` (Conversational)

## Quality Gates
- **Build Validation**: All PRs must pass `tsc -b` and `vite build`.
- **Linting**: ESLint must pass on all modified files.
- **GSD Verify Work**: All critical flows must be validated via GSD Verify Work before merge.
