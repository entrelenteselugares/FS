---
status: passed
---

# VERIFICATION-43: Multi-Profile Transition (NETWORK)

## 📋 UAT Criteria

### 1. Unified Identity & Photos

- [x] User can upload a profile photo from the "Minha Conta" page.
- [x] Profile photo is correctly saved in Supabase and displayed in the Navbar.
- [x] Profile photo is persisted even after role switching.

### 2. Role Transition Flow

- [x] A `CLIENTE` can see the "Seja um Parceiro" section.
- [x] Filling the Professional form creates a record in the `profissionais` table.
- [x] The user is notified that their profile is "Under Review" and cannot access the professional dashboard yet.

### 3. Admin Approval & Onboarding

- [x] Manually setting `isVerified: true` for the user allows access to the Professional dashboard.
- [x] The first time a user accesses the professional dashboard, they see the "Welcome" landing page.
- [x] The "Guided Tour" starts automatically and explains at least 3 key areas (Sidebar, Financials, Events).

### 4. Role Switcher

- [x] User with multiple roles sees the "Trocar Perfil" option in the Navbar.
- [x] Switching to "CLIENTE" redirects to the store/vault.
- [x] Switching to "PROFISSIONAL" redirects to the professional dashboard.

## 🧪 Integration Scripts

- `backend/scripts/test-phase43.ts`: Automates the `apply-role` and `isVerified` check.
