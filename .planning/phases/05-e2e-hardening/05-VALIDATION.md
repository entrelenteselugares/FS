# Phase 05: E2E Hardening - Validation

## Dimension 8: Verification Quality (Nyquist)

### 1. Functional Integrity

- [ ] User is created in `User` table with role `PROFISSIONAL`.
- [ ] User is created in Supabase Auth.
- [ ] Profile is redirected to `/profissional/dashboard`.

### 2. Visual & UX Standards

- [ ] Design tokens `.fs-input` and `.fs-btn` are used and visible during the test.
- [ ] No "Flash of Unstyled Content" (FOUC) during registration transitions.

### 3. Reliability

- [ ] Test passes consistently on 3 consecutive runs (to verify dynamic email logic).
- [ ] Playwright config correctly handles the proxy to `localhost:3001`.

## UAT Criteria

1. **Scenario:** Professional Registration.
2. **Input:** Dynamic email, random name, professional skills.
3. **Outcome:** Successful login session established and dashboard accessible.

---
*Phase: 05-e2e-hardening*
*Validation defined: 2026-05-03*
