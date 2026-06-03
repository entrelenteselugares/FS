# PLAN-43: Multi-Profile Transition (NETWORK)

## 🎯 Phase Objective

Transform the platform into a multi-role ecosystem where users can apply for and switch between roles (Client, Professional, Unit) with a premium guided onboarding experience.

## 🛠️ Step-by-Step Execution

### Wave 1: Database & Backend Foundation

- [ ] **Step 1: Schema Update**: Add `profileImageUrl` to the `User` model in `schema.prisma`.
- [ ] **Step 2: Migration**: Run `npx prisma migrate dev` to update the database.
- [ ] **Step 3: Controller Expansion**:
  - Update `AuthController.updateMe` to accept `profileImageUrl`.
  - Create `AuthController.applyRole` to handle role applications (upsert `Profissional` or `Cartorio` models with initial data).
- [ ] **Step 4: Storage Setup**: Ensure a `profiles` bucket exists in Supabase Storage (via script or manual instruction).

### Wave 2: Frontend Profile & Role Switcher

- [ ] **Step 5: Photo Upload**: Implement `ProfilePhotoUpload` component in `MinhaContaPage.tsx` using the base64 upload pattern.
- [ ] **Step 6: Role Application UI**: Create "Seja um Parceiro" section in the profile page with forms for Profissional/Cartório.
- [ ] **Step 7: AuthContext Update**:
  - Add `switchRole` method to `AuthContext`.
  - Handle session persistence for the _current active role_.
- [ ] **Step 8: Navbar Integration**: Add the "Trocar de Perfil" dropdown in the user menu.

### Wave 3: Onboarding & Guided Tour

- [ ] **Step 9: Welcome Landing Page**: Create `WelcomePartner.tsx` to introduce the new dashboard.
- [ ] **Step 10: Guided Tour Component**: Build a `DashboardTour.tsx` using `framer-motion` (premium tooltips) to explain:
  - Sidebar navigation.
  - Financial payouts.
  - Event management.
- [ ] **Step 11: Gate Access**: Ensure `ProfissionalDashboard` and `FranchiseDashboard` show a "Waiting Approval" state if `isVerified` is false.

## 🧪 Verification Plan

### Automated Tests (Integration)

- [ ] **Auth-Role-01**: `POST /auth/apply-role` correctly creates a `Profissional` record and sets `isVerified: false`.
- [ ] **Auth-Switch-02**: Verify that changing the active role in the frontend redirects to the correct dashboard.

### Manual UAT (User Acceptance)

- [ ] **Scenario 1**: Register as a Client -> Upload Profile Photo -> Apply for Professional -> See "Waiting Approval" state.
- [ ] **Scenario 2**: Admin (via DB) sets `isVerified: true` -> User logs in -> See Welcome Page -> Run Guided Tour.
- [ ] **Scenario 3**: User with both roles switches from Client Dashboard to Professional Dashboard via Navbar.

## 🗓️ Traceability

- **R1**: Join as Partner Flow (Step 6)
- **R2**: Backend Upsert & Schema (Steps 1, 3)
- **R3**: Role Switcher (Steps 7, 8)
- **R4**: Welcome Page & Tour (Steps 9, 10)
