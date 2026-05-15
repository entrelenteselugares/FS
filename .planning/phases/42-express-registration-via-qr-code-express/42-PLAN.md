---
phase: 42
plan: Express Registration via QR Code
type: implementation
wave: 1
depends_on: []
files_modified:
  - backend/prisma/schema.prisma
  - backend/src/controllers/auth.controller.ts
  - backend/src/routes/index.ts
  - frontend/src/contexts/AuthContextBase.ts
  - frontend/src/contexts/AuthContext.tsx
  - frontend/src/pages/PhygitalCapture.tsx
  - frontend/src/components/Navbar.tsx
  - backend/src/controllers/profissional.controller.ts
autonomous: true
requirements:
  - EXPRESS-01
  - EXPRESS-02
  - EXPRESS-03
  - EXPRESS-04
---

<objective>
Implement a frictionless express registration flow for Phygital capture users, including schema updates, a new backend endpoint, integrated frontend form, profile completion tracking, and a reward system.
</objective>

<tasks>

### Wave 1: Database & Backend Auth Foundation
- [ ] **Task 1.1: Update User Schema**
  - **Type:** backend
  - **Files:** `backend/prisma/schema.prisma`
  - **Action:** Add `profileComplete Boolean @default(false)` to `User` model.
  - **Verify:** `npx prisma db push` succeeds.
  - **Acceptance Criteria:** Database has the new column.

- [ ] **Task 1.2: Implement Express Registration Controller**
  - **Type:** backend
  - **Files:** `backend/src/controllers/auth.controller.ts`
  - **Action:** Implement `registerExpress` method. Should handle user creation in Supabase and Prisma with `profileComplete: false` and `role: CLIENTE`.
  - **Verify:** Endpoint exists and returns a token.
  - **Acceptance Criteria:** New users can be created with only email/password.

- [ ] **Task 1.3: Register Auth Route**
  - **Type:** backend
  - **Files:** `backend/src/routes/index.ts`
  - **Action:** Add `router.post("/auth/register-express", AuthController.registerExpress)`.
  - **Verify:** `curl -X POST http://localhost:3001/api/auth/register-express` (mock).

### Wave 2: Frontend Integration
- [ ] **Task 2.1: Update Auth Types & Context**
  - **Type:** frontend
  - **Files:** 
    - `frontend/src/contexts/AuthContextBase.ts`
    - `frontend/src/contexts/AuthContext.tsx`
  - **Action:** Add `profileComplete` to `AuthUser` interface and handle it in the provider.
  - **Verify:** No TypeScript errors.

- [ ] **Task 2.2: Enhance Phygital Capture Form**
  - **Type:** frontend
  - **Files:** `frontend/src/pages/PhygitalCapture.tsx`
  - **Action:** 
    - Add logic to check if email exists.
    - If new user, show password field.
    - Modify submission to call `registerExpress` for new users.
  - **Verify:** User can register and upload in one go.
  - **Acceptance Criteria:** Seamless onboarding for non-registered users.

### Wave 3: Conversion Engine & Rewards
- [ ] **Task 3.1: Profile Completion Logic**
  - **Type:** backend
  - **Files:** `backend/src/controllers/auth.controller.ts` (or profile controller)
  - **Action:** In the profile update method, add a check: if `nome`, `whatsapp`, and `cep` are filled and `profileComplete` is false, toggle it and trigger coupon generation.
  - **Verify:** Updating profile toggles the flag.

- [ ] **Task 3.2: Reward Generation (Coupon)**
  - **Type:** backend
  - **Files:** `backend/src/services/coupon.service.ts` (create if needed)
  - **Action:** Logic to generate a unique free shipping coupon for the user.
  - **Verify:** Coupon is created in DB.

### Wave 4: UX Polishing
- [ ] **Task 4.1: Incomplete Profile Banner**
  - **Type:** frontend
  - **Files:** 
    - `frontend/src/components/IncompleteProfileBanner.tsx` (new)
    - `frontend/src/components/Navbar.tsx`
  - **Action:** Create the banner and integrate it into the Navbar.
  - **Verify:** Banner appears for express users and disappears after completion.

</tasks>

<verification>
1. Register a new user via Phygital Capture.
2. Confirm user is created with `profileComplete: false`.
3. Verify banner appears in Navbar.
4. Complete profile in account settings.
5. Verify `profileComplete` becomes `true`, banner disappears, and coupon is granted.
</verification>

<success_criteria>
- [ ] Frictionless express registration works end-to-end.
- [ ] `profileComplete` flag correctly tracks user state.
- [ ] Global banner drives profile completion.
- [ ] Reward system successfully delivers coupons.
</success_criteria>

## PLANNING COMPLETE
