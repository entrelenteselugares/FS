# Phase 32 Context: Production Hardening & Operations

## 🎯 Decisions
1. **Error Tracking**: Use Sentry.
   - **Org Slug**: `foto-segundo`
   - **DSN**: To be provided via `.env` (SENTRY_DSN).
   - **Scope**: Frontend (browser errors) and Backend (exception logging).
2. **Analytics**: Use GA4.
   - **Events**:
     - `login`: User successfully logged in.
     - `purchase`: Checkout completed.
     - `pro_registration`: New photographer signed up.
     - `print_click`: User clicked to print a photo.
3. **CI/CD**: GitHub Actions.
   - **Workflow**: On `push` to `main` and `pull_request` to `main`.
   - **Steps**: Lint, Type-check, and Playwright E2E tests.
   - **Deploy**: Vercel (triggered only if GitHub Actions pass).
4. **Health Monitoring**:
   - **Endpoint**: `/api/health` (Backend).
   - **Checks**: Database (Prisma `$queryRaw` "SELECT 1") and basic system status.

## 🏗️ Technical Approach
- **Sentry SDK**: `@sentry/nextjs` (for frontend/API routes) or `@sentry/node` (for standalone backend).
- **GitHub Action**: Use standard `.github/workflows/verify.yml`.
- **Health Endpoint**: Simple controller in `backend/src/controllers/health.controller.ts`.

## 📂 Reusable Assets
- `playwright.config.ts`: Use as the base for CI test command.
- `backend/src/lib/prisma.ts`: Use for health check connectivity test.

---
*Created: 2026-05-14 | Phase 32*
