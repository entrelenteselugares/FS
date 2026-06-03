# Phase 42: Express Registration via QR Code — Specification

**Created:** 2026-05-15
**Ambiguity score:** 0.15 (gate: ≤ 0.20)
**Requirements:** 5 locked

## Goal

Create a frictionless "Express Registration" flow for users scanning Phygital QR codes, allowing account creation with only Email and Password directly on the capture page, with a "Complete Profile" nudge later.

## Background

Currently, when a user scans a Phygital QR code (e.g., in `PhygitalCapture.tsx`) and is not logged in, the system checks if the email exists. If not, it forces a redirect to the full `/register` page. This causes a "bad experience" (as per user feedback) because it breaks the flow of taking/uploading a photo. The goal is to keep the user on the capture page and create a "Skeleton" account.

## Requirements

1. **Integrated Express Form**: `PhygitalCapture.tsx` must show Email and Password fields for guests instead of redirecting to registration.
   - Current: Redirects to `/register` if email is not found in a public check.
   - Target: User enters Email/Password; the "Enviar" button triggers an express registration if the user doesn't exist.
   - Acceptance: Guest user can upload a photo and create an account in a single click without leaving `/phygital-capture`.

2. **Auto-Generated Identity**: Use the email prefix (before `@`) as the temporary `nome` for the user.
   - Current: Full registration requires `nome` input.
   - Target: Express registration API sets `nome = email.split('@')[0]` if no name is provided.
   - Acceptance: Database entry for user shows a valid string in the `nome` field derived from the email.

3. **Profile Completeness Tracking**: Implement a logic (e.g., `isProfileComplete` field or computed check) to identify "Express" users.
   - Current: No distinction between full and express registrations.
   - Target: User model includes a way to check if `whatsapp`, `cpf`, and full `nome` have been provided.
   - Acceptance: API returns a `profileComplete: false` flag for express users.

4. **Nudge Banner**: Display a prominent banner for incomplete profiles in the Navbar and Dashboard.
   - Current: No "incomplete profile" notifications.
   - Target: Banner "Finalize seu cadastro e ganhe cupom de frete grátis" appears in `Navbar.tsx` and `/minha-conta`.
   - Acceptance: Banner is visible ONLY to users with incomplete profiles.

5. **Completion Reward**: Grant a free shipping coupon upon completing the "Meu Perfil" data.
   - Current: No reward logic for profile completion.
   - Target: Logic in the profile update service checks if all mandatory fields are filled and generates/assigns a coupon.
   - Acceptance: After filling all fields in `ProfileTab.tsx`, the user receives a confirmation of the free shipping coupon.

## Boundaries

**In scope:**

- UI changes to `PhygitalCapture.tsx` to include password input.
- Backend support for "express" registration (email + password only).
- `User` model/logic updates for profile completeness.
- Global `IncompleteProfileBanner` component.
- Coupon generation logic triggered by profile completion.

**Out of scope:**

- Social login (Google/Apple) integration (separate phase).
- SMS verification for Express registration.
- Changes to PRO or ADMIN registration flows (stays full-form only).

## Constraints

- Express registration must default to the `CLIENTE` role.
- Security: Password hashing and JWT generation must match the existing `AuthController.register` standards.

## Acceptance Criteria

- [ ] User can scan QR and upload photo with just email/password without redirect.
- [ ] Account is created in the database with `nome` derived from email.
- [ ] Logged-in user with incomplete profile sees the "Frete Grátis" banner.
- [ ] Banner disappears immediately after profile fields (CPF, WhatsApp, etc.) are saved.
- [ ] Coupon is successfully added to the user's account/available for checkout after completion.

## Ambiguity Report

| Dimension           | Score | Min   | Status | Notes |
| ------------------- | ----- | ----- | ------ | ----- |
| Goal Clarity        | 0.90  | 0.75  | ✓      |       |
| Boundary Clarity    | 0.85  | 0.70  | ✓      |       |
| Constraint Clarity  | 0.80  | 0.65  | ✓      |       |
| Acceptance Criteria | 0.85  | 0.70  | ✓      |       |
| **Ambiguity**       | 0.15  | ≤0.20 | ✓      |       |

## Interview Log

| Round | Perspective     | Question summary        | Decision locked                    |
| ----- | --------------- | ----------------------- | ---------------------------------- |
| 1     | Researcher      | Passwords vs Temp?      | Email + Password on same screen.   |
| 1     | Researcher      | Redirect?               | No redirect, stay on capture page. |
| 2     | Simplifier      | Name source?            | Use email prefix before "@".       |
| 2     | Simplifier      | Definition of Complete? | All "Meu Perfil" fields filled.    |
| 2     | Boundary Keeper | Banner Location?        | Navbar and Dashboard.              |

---

_Phase: 42-express-registration_
_Spec created: 2026-05-15_
_Next step: /gsd-discuss-phase 42 — implementation decisions (how to build what's specified above)_
