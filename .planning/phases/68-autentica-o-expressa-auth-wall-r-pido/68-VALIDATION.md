---
phase: 68
slug: autentica-o-expressa-auth-wall-r-pido
date: 2026-06-12
---

# Nyquist Validation Strategy: Phase 68

## 1. UAT Scripts (User Acceptance Testing)
- [ ] User can click "Continue with Google" on the Auth Wall, complete the OAuth flow, and instantly view the restricted photos.
- [ ] User can click "Continue with Apple" on the Auth Wall, complete the OAuth flow, and instantly view the restricted photos.
- [ ] Traditional email/password login still works and logs the user in successfully.
- [ ] The `AuthModal` clearly emphasizes the Social Login buttons visually over the manual input fields.

## 2. Technical Invariants
- `AuthContext.tsx` maintains synchronization between Supabase JWT and the internal backend HttpOnly cookie.
- Users created via OAuth must correctly propagate to the Prisma `User` table (via backend sync logic in `/auth/me`).

## 3. Rollback Triggers
- Supabase OAuth provider configurations are missing or return `redirect_uri_mismatch` in production.
- Existing email/password users are locked out due to `AuthContext` changes.
