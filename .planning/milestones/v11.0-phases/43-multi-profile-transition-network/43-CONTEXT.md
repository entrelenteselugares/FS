# CONTEXT-43: Multi-Profile Transition (NETWORK)

## 🎯 Domain Boundary

The capability to manage multiple professional roles (Professional, Unit) under a single user identity, including a controlled onboarding flow and identity verification.

## 🏗️ Technical implementation decisions

- **Identity**: Add `profileImageUrl` to the `User` model.
- **Role Verification**: Access to dashboard routes for `PROFISSIONAL` and `CARTORIO` will be gated by `isVerified` (Professional) or a new `approvalStatus` if necessary.
- **Onboarding Tour**: Use a custom guided tour component (or library like `react-joyride`) with a "Midnight Luxury" skin to guide new partners.
- **Landing Page**: New `/welcome-partner` route that triggers upon role application approval.
- **Role Switching**: The `AuthContext` will be updated to handle a `currentRole` state, allowing the UI to adapt without full session invalidation.

## 🎨 UI/UX Decisions

- **Profile Photo**: Circular avatar upload in the "Meu Perfil" section.
- **Role Switcher**: Located in the Navbar dropdown, showing all profiles linked to the account.
- **Onboarding Popups**: Interactive tooltips explaining the Sidebar, Payouts, and Events management.

## 🛠️ Canonical Refs

- [43-SPEC.md](file:///c:/foto-segundo/.planning/phases/43-multi-profile-transition-network/43-SPEC.md)
- [schema.prisma](file:///c:/foto-segundo/backend/prisma/schema.prisma)
- [AuthContext.tsx](file:///c:/foto-segundo/frontend/src/contexts/AuthContext.tsx)

## ⏩ Next Steps

1. Update Prisma schema with `profileImageUrl`.
2. Implement role application logic in the backend.
3. Build the "Seja um Parceiro" UI and the Guided Tour component.
