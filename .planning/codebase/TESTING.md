# Testing - Foto Segundo

## Frameworks
- **Backend**: Jest + Supertest (API testing).
- **Frontend**: Vitest (Planned/Partial).
- **Validation**: Manual UAT for critical UI flows.

## Test Types
- **Integration Tests**: Verification of Prisma queries and controller responses (e.g., `resilience.test.ts`).
- **Resilience**: Stress testing production endpoints (e.g., `scratch/stress_test_production.js`).
- **Data Integrity**: Manual SQL audits and reset scripts (`reset_db_sql.js`).

## Running Tests
- **Backend**: `npm test --prefix backend`
- **Manual Stress**: `node scratch/stress_test_production.js`

## Quality Gates
- **Build Validation**: All PRs must pass `tsc -b` and `vite build`.
- **Linting**: ESLint must pass on all modified files.
