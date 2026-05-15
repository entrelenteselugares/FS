# Phase 42: Express Registration via QR Code — Research

## 🎯 Implementation Strategy

### 1. Database Schema
- **File**: `backend/prisma/schema.prisma`
- **Change**: Add `profileComplete Boolean @default(false)` to the `User` model.
- **Migration**: Run `npx prisma db push` to update the schema.

### 2. Backend Auth Logic
- **Controller**: `backend/src/controllers/auth.controller.ts`
- **Method**: Add `static async registerExpress(req: Request, res: Response)`
  - Input: `email`, `senha`, `nome` (optional, derived from email if missing), `whatsapp` (optional).
  - Logic: Create user in Supabase Auth and Prisma DB with `role: CLIENTE` and `profileComplete: false`.
- **Routes**: `backend/src/routes/index.ts`
  - Register `router.post("/auth/register-express", AuthController.registerExpress)`.

### 3. Frontend "Phygital Capture" Flow
- **File**: `frontend/src/pages/PhygitalCapture.tsx`
- **Changes**:
  - Add state `password` and `isNewUser` (boolean).
  - Update `customerEmail` change logic to debounce a check to `/public/auth/check`.
  - If user doesn't exist: set `isNewUser: true`, show a password field.
  - On `handleSubmit`:
    - If `isNewUser`, call `registerExpress` first, then login, then proceed with upload.
    - If existing user (but not logged in), maybe prompt to login? Or allow guest upload if policy permits (currently it redirects to register).
  - **Correction**: The simplest UX is to allow them to set a password in the same form and perform `registerExpress` as part of the submission if they are not logged in.

### 4. Profile Completion Engine
- **Logic**: A profile is complete when `nome` is set (and not equal to email prefix), `whatsapp` is present, and address fields (at least `cep`) are filled.
- **Trigger**: In `AuthController.updateMe` or `profissional.controller.ts:updateProfile`, check if these conditions are met.
- **Reward**: If meeting conditions for the first time:
  - Generate a coupon `FS-FRETE-GRATIS-[RANDOM]`.
  - Send via notification/email.
  - Set `profileComplete: true`.

### 5. Global Nudge Banner
- **Component**: Create `frontend/src/components/IncompleteProfileBanner.tsx`.
- **Integration**: Insert into `frontend/src/components/Navbar.tsx` before the `<nav>` tag.
- **Visibility**: `if (user && !user.profileComplete)`.

## 🛠️ Code References
- Auth Routes: `backend/src/routes/index.ts:L287`
- Phygital Upload: `backend/src/controllers/phygital.controller.ts:L11`
- User Model: `backend/prisma/schema.prisma`
- Navbar: `frontend/src/components/Navbar.tsx`
- Auth Context: `frontend/src/contexts/AuthContextBase.ts`

## ⚠️ Potential Landmines
- **Supabase Sync**: Ensure user creation in Supabase Auth is successful before creating in Prisma.
- **Session Persistence**: After express registration, the user should be automatically logged in to keep the friction low.
- **Address Validation**: Ensure `profileComplete` logic correctly validates the `endereco` format or individual fields.
