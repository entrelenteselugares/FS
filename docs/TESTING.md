<!-- generated-by: gsd-doc-writer -->
# Testing Guide: Foto Segundo

Quality assurance in Foto Segundo is driven by end-to-end (E2E) testing to ensure transaction integrity across all phygital verticals.

## Test Framework and Setup

- **Primary Framework:** [Playwright](https://playwright.dev/)
- **Configuration:** `playwright.config.ts`
- **Identity Variations:** We test across 13 distinct identity variations including Master Admin, Photographer, Franchisee, and End Client.

To set up the test environment:

```bash
npx playwright install --with-deps
```

## Running Tests

| Command | Description |
|---------|-------------|
| `npm run test:e2e:all` | Runs the full E2E suite in headless mode. |
| `npx playwright test --ui` | Opens the Playwright UI for interactive debugging. |
| `npx playwright test e2e/auth.spec.ts` | Runs a specific test file. |
| `npx playwright show-report` | Views the HTML report of the last test run. |

## Writing New Tests

1. **Location:** Place new tests in the `/e2e` directory using the `*.spec.ts` extension.
2. **Naming Convention:** Describe the feature being tested (e.g., `marketplace-checkout.spec.ts`).
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

## CI Integration

Tests are integrated into our CI pipeline (GitHub Actions).

- **Trigger:** Every Push to `main` or `dev`.
- **Environment:** A dedicated staging database is used for CI runs.
- **Artifacts:** Videos and traces are captured for failing tests and available in the CI logs.
