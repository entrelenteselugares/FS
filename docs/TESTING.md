<!-- GSD:TESTING -->
# Testing Guide: Foto Segundo

Quality assurance in Foto Segundo is driven by end-to-end (E2E) testing to ensure transaction integrity across all phygital verticals.

## Test Framework and Setup

- **E2E Testing:** [Playwright](https://playwright.dev/)
- **Backend Testing:** [Jest](https://jestjs.io/)
- **Configuration:** `playwright.config.ts` (E2E), `backend/jest.config.js` (Backend)
- **Identity Variations:** We test across 13 distinct identity variations including Master Admin, Photographer, Franchisee, and End Client.

To set up the test environment:

```bash
npx playwright install --with-deps
```

## Running Tests

| Command | Description |
|---------|-------------|
| `npm test` | Runs the main E2E suite (Playwright). |
| `npm run test:certify` | Executes the launch certification robot (E2E). |
| `npm run test --prefix backend` | Runs backend resilience tests (Jest). |
| `npx tsx backend/src/tests/flash-scale.test.ts` | Runs the high-concurrency Flash Event stress test. |
| `npm run test:all --prefix backend` | Runs all backend unit and integration tests. |
| `npx playwright test --ui` | Opens the Playwright UI for interactive debugging. |
| `npx playwright show-report` | Views the HTML report of the last test run. |

## Writing New Tests

1. **Location:** Place new tests in the `/e2e` directory using the `*.spec.ts` extension.
2. **Naming Convention:** Describe the feature being tested (e.g., `e2e/launch-certification-robot.spec.ts`).
3. **Fixtures:** Use existing authentication fixtures to bypass login screens.
4. **Cleanup:** Ensure tests clean up created database records to maintain environment stability.

Example Test:

```typescript
import { test, expect } from '@playwright/test';

test('should load the home page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Foto Segundo')).toBeVisible();
});
```

## Coverage Requirements

We prioritize functional coverage over line coverage. Current benchmarks:

- **Auth Flow:** 100%
- **Financial Transactions:** 100%
- **Flash Event Resgate:** 100%
- **Admin Management:** > 80%
- **Multi-Vertical (School/Sports):** > 80%
- **Growth Engine (Coupons/Affiliates):** > 70%

## CI Integration

Tests are integrated into our CI pipeline (GitHub Actions).

- **Trigger:** Every Push to `main` or `dev`.
- **Environment:** A dedicated staging database is used for CI runs.
- **Artifacts:** Videos and traces are captured for failing tests and available in the CI logs.


<!-- GSD-DOCS-UPDATE: SUPPLEMENTED -->
*Documentação verificada e complementada automaticamente via GSD-SDK em 2026-05.*
