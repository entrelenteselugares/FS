---
phase: 32
name: Production Hardening & Operations
wave: 1
---

# Phase 32 Plan: Production Hardening & Operations

## Objective
Prepare the Foto Segundo platform for real-world production traffic with robust monitoring,
error tracking, analytics, and automated CI/CD.

## Tasks

### OPS-01 — Sentry Error Tracking
- Install `@sentry/react` + `@sentry/node` SDKs (frontend already has stub)
- Configure `frontend/src/main.tsx` Sentry init with DSN from `VITE_SENTRY_DSN` env var
- Configure `backend/src/index.ts` Sentry init with DSN from `SENTRY_DSN` env var
- Add `Sentry.captureException` to backend global error handler middleware
- Add frontend ErrorBoundary wrapping `<App />` that reports to Sentry

### OPS-02 — GA4 Conversion Tracking
- Add `gtag.js` loader to `frontend/index.html` via `VITE_GA_ID` env var (no-op if unset)
- Create `frontend/src/lib/analytics.ts` with typed helpers: `trackLogin()`, `trackPurchase()`, `trackProRegistration()`, `trackPrintClick()`
- Call `trackPurchase()` in `CheckoutPage.tsx` after `setPaymentSuccess(true)`
- Call `trackLogin()` in `LoginPage.tsx` after successful auth
- Call `trackProRegistration()` in `RegisterPage.tsx` after pro onboarding step

### OPS-03 — GitHub Actions CI/CD
- Create `.github/workflows/verify.yml`
- Steps: checkout → setup Node 20 → install frontend deps → tsc type-check → eslint → install backend deps → tsc type-check → playwright install → playwright E2E (`venda-unitaria.spec.ts`)
- Trigger on: `push` to `main`, `pull_request` to `main`
- Cache `node_modules` with `actions/cache` for speed

### OPS-04 — Health Monitoring Endpoint
- Create `backend/src/controllers/health.controller.ts` with `GET /api/health`
- Checks: Prisma `$queryRaw SELECT 1` (database), `process.uptime()` (runtime), `process.memoryUsage()` (memory)
- Returns JSON: `{ status, uptime, db, memory, timestamp }`
- Register route in `backend/src/routes/public.routes.ts`

## Success Criteria
- [ ] Sentry DSN configured — frontend captures test error, backend logs unhandled exception
- [ ] GA4 `purchase` event fires after PIX generation (visible in DebugView)
- [ ] GitHub Actions workflow passes green on a test push
- [ ] `GET /api/health` returns `{ status: "ok" }` with DB ping < 100ms
