# Phase 05: E2E Hardening - Plan

This phase implements automated E2E tests for the Professional Registration flow using Playwright.

## User Review Required
> [!IMPORTANT]
> The tests will generate real entries in your Supabase Auth and Prisma database. We are using the `+` email trick to avoid conflicts, but you may see several `contatofotosegundo+test_...` users in your dashboard.

- [ ] **Email Pattern:** `contatofotosegundo+test_<timestamp>@gmail.com`
- [ ] **Browser:** Chromium (Default)

---

## Wave 1: Infrastructure & Setup
Establish the Playwright environment.

- [ ] **Task 1.1: Install Dependencies**
  - Run `npm install -D @playwright/test`
  - Run `npx playwright install chromium`
- [ ] **Task 1.2: Configure Playwright**
  - Create `playwright.config.ts` in the root.
  - Set `baseURL` to `http://localhost:3000`.
  - Configure to start the dev server automatically if not running (optional, but recommended).

## Wave 2: Test Implementation
Build the core registration test.

- [ ] **Task 2.1: Create Auth Utilities**
  - Create `e2e/utils/auth-helpers.ts`.
  - Implement `generateTestEmail()` and `fillRegisterForm()`.
- [ ] **Task 2.2: Implement Registration Spec**
  - Create `e2e/auth/registration.spec.ts`.
  - Test Case: "Should register a new Professional and redirect to dashboard".
  - Steps:
    1. Navigate to `/register`.
    2. Select "Profissional da Rede" tab.
    3. Fill form with dynamic email.
    4. Accept terms.
    5. Submit and wait for `/profissional/dashboard`.

## Wave 3: Validation & Polish
Verify the suite and document usage.

- [ ] **Task 3.1: Execute & Debug**
  - Run `npx playwright test`.
  - Resolve any selector issues or timing glitches.
- [ ] **Task 3.2: Update Documentation**
  - Add a "Testing" section to `README.md` or a new `TESTING.md`.

---

## Verification Plan

### Automated Verification
- [ ] Run `npx playwright test e2e/auth/registration.spec.ts` and ensure it passes.
- [ ] Check Prisma DB for the new user record.
- [ ] Check Supabase Auth for the new user record.

### Manual Verification
- [ ] Run Playwright in UI mode (`npx playwright test --ui`) and watch the execution.
- [ ] Verify that the generated email correctly appears in the "Identificação" field.

---
*Phase: 05-e2e-hardening*
*Plan created: 2026-05-03*
