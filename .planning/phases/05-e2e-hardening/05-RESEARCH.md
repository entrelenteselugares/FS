# Phase 05: E2E Hardening - Research

## Overview
Implementation of E2E tests using Playwright to validate the "Midnight Luxury" registration flow.

## Technical Stack
- **Test Runner:** `@playwright/test`
- **Frontend:** Vite + React (Port 3000)
- **Backend:** Express + Prisma (Port 3001)
- **Auth:** Supabase Auth (Local/Production)

## Key Challenges & Solutions

### 1. Database Duplicity (Prisma/Supabase)
- **Problem:** Re-running registration tests with the same email causes `409 Conflict` or Prisma `@unique` violations.
- **Solution:** Dynamic email suffixing. 
  - Pattern: `contatofotosegundo+test_${Date.now()}@gmail.com`.
  - Implementation: A helper utility `createTestEmail()` in `e2e/utils/auth.ts`.

### 2. State Cleanup
- **Option A:** Delete user from database after test. (Requires Prisma `delete` which might cascade or fail due to foreign keys).
- **Option B:** Ignore cleanup and rely on dynamic emails. (Best for "Hardening" phase to avoid complex teardown logic initially).
- **Decision:** **Option B** for now. We will use dynamic emails and manually clear the "test" users periodically if needed.

### 3. Redirection Validation
- **Goal:** User should land at `/profissional/dashboard`.
- **Validation:** Use `await expect(page).toHaveURL(/.*\/profissional\/dashboard/)`.

### 4. UI Selectors
- **Pattern:** Use `fs-input` and role-based selectors (`getByRole('button', { name: /Entrar/i })`).
- **Wait Strategy:** Playwright's auto-waiting is sufficient for most Vite-based transitions.

## Proposed Structure
```
/e2e
  /auth
    registration.spec.ts
  /utils
    auth-helpers.ts
playwright.config.ts
```

## Setup Command
`npm install -D @playwright/test`
`npx playwright install --with-deps chromium` (limiting to chromium for speed in local dev).

---
*Phase: 05-e2e-hardening*
*Research completed: 2026-05-03*
