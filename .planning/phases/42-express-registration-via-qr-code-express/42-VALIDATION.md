# Phase 42: Express Registration via QR Code — Validation

**Status:** Draft
**Last Updated:** 2026-05-15

## 🧪 Verification Strategy

### 1. Build & Types

- [ ] Backend compiles without errors.
- [ ] Frontend compiles without errors.
- [ ] Prisma types generated and used correctly.

### 2. Functional Tests (UAT)

- [ ] **Express Registration**:
  - Access `/phygital-capture` with a new email.
  - See password field appear.
  - Submit form.
  - Verify user is created in DB with `profileComplete: false`.
  - Verify photo is uploaded and linked to the new user.
- [ ] **Banner Visibility**:
  - Login with an express user.
  - Verify "Incomplete Profile" banner is visible on the home page/navbar.
- [ ] **Profile Completion**:
  - Navigate to profile page.
  - Fill all required fields (Name, WhatsApp, CEP).
  - Save profile.
  - Verify `profileComplete` toggles to `true`.
  - Verify banner disappears.
- [ ] **Reward Delivery**:
  - Verify a coupon is generated and visible in the user's account.

### 3. Automated Validation

- [ ] Run `npx prisma db push` to verify schema integrity.
- [ ] Run `npm run build` in both frontend and backend.
