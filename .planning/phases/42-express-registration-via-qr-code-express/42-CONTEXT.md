# Phase 42: Express Registration via QR Code — Context

**Status:** Decisions Locked
**Date:** 2026-05-15

## Domain

Frictionless onboarding flow for Phygital capture users using email + password only, with a conversion engine for profile completion via rewards.

<spec_lock>

## Locked Requirements (from SPEC.md)

1. **Integrated Express Form**: `PhygitalCapture.tsx` shows Email/Password for guests.
2. **Auto-Generated Identity**: `nome` is derived from email prefix.
3. **Profile Completeness Tracking**: Track users who signed up via express flow.
4. **Nudge Banner**: Global high-visibility banner for incomplete profiles.
5. **Completion Reward**: Free shipping coupon granted upon completion.

</spec_lock>

## Decisions Captured

### 🛠️ Backend Strategy

- **Isolated Endpoint**: Implement `POST /api/auth/register-express`.
  - Logic: Simplifies `AuthController` by only requiring email/password.
  - Defaults: `role: CLIENTE`, `profileComplete: false`.
  - Identity: Set `nome` to `email.split('@')[0]`.
- **Database Schema**:
  - Add `profileComplete: Boolean @default(false)` to the `User` model.
  - This flag will be toggled to `true` once all mandatory fields are filled.
- **Completion Trigger**:
  - A profile is considered complete when: `nome` (not email-prefix), `whatsapp`, and `address` (CEP/Street) are present.
  - On the first update that meets these criteria, system generates a unique coupon.

### 🎨 Frontend UI/UX

- **Integrated Form**: Modify `PhygitalCapture.tsx` to include a password field when a guest email is entered.
- **Global Nudge**: Implement `IncompleteProfileBanner.tsx` in the `Navbar`.
  - Style: High-visibility alert (Sticky Top-bar).
  - Message: "Finalize seu cadastro e ganhe cupom de frete grátis".
- **Reward Delivery**:
  - Upon successful profile update, show a "Confetti" success state with the unique coupon code.
  - Send the coupon code via a new notification/email.

### 💸 Coupon System

- **Generation**: Generate a unique code (e.g., `FS-FREE-XXXX`) with `discountAbs: shipping_fee` (or similar logic for free shipping).
- **Persistence**: Link the coupon to the `User` in the database.

## Canonical Refs

- [schema.prisma](file:///c:/foto-segundo/backend/prisma/schema.prisma)
- [auth.controller.ts](file:///c:/foto-segundo/backend/src/controllers/auth.controller.ts)
- [PhygitalCapture.tsx](file:///c:/foto-segundo/frontend/src/pages/PhygitalCapture.tsx)
- [42-SPEC.md](file:///c:/foto-segundo/.planning/phase42/42-SPEC.md)

## Deferred Ideas

- Social Login (Google/Apple) for Express flow.
- SMS-based express registration.
