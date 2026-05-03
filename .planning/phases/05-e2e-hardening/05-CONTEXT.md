# Phase 05: E2E Hardening - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning
**Source:** User Request (Hardening with Playwright)

## Phase Boundary

This phase focuses on implementing a robust End-to-End (E2E) testing suite using Playwright. The primary goal is to validate the critical path for Professional/Franqueado registration, ensuring visual consistency, data integrity (Supabase/Prisma), and functional redirection.

## Implementation Decisions

### Testing Infrastructure

- **Framework:** Playwright (latest stable).
- **Environment:** Must run against the local development server (or a designated staging environment).
- **Target:** Next.js 14 frontend.

### Authentication & Data Flow

- **Email Bypass:** Use a dynamic email generation strategy: `contatofotosegundo+teste<timestamp>@gmail.com`.
- **Database:** Verify that records are correctly created in Prisma and synchronized with Supabase Auth.
- **Redirection:** Ensure the user is landed at `/profissional/dashboard` after a successful registration.

### UI Consistency

- **Design System:** Tests must verify that the "Midnight Luxury" tokens (`.fs-input`, `.fs-btn`) are correctly rendered and interactive.

### The Agent's Discretion

- Selection of specific Playwright reporters (suggesting HTML or List for local runs).
- Exact wait strategies (prioritizing `waitForRole` and `waitForText`).
- Organization of test utilities (e.g., `e2e/utils/auth-helpers.ts`).

## Canonical References

- `frontend/src/pages/RegisterPage.tsx` — Reference for the registration form structure.
- `backend/prisma/schema.prisma` — Reference for user roles and data models.
- `frontend/src/index.css` — Reference for design tokens.

## Specific Ideas

- Generate a timestamped email to avoid `@unique` constraint violations in Prisma/Supabase.
- Simulate the selection of the "Profissional da Rede" role in the RegisterPage tabs.

## Deferred Ideas

- Full E2E coverage for the admin dashboard (to be handled in a later phase).
- CI/CD integration (GitHub Actions) for Playwright runs.

---

*Phase: 05-e2e-hardening*
*Context gathered: 2026-05-03*
