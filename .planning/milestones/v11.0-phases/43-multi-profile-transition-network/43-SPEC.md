# SPEC-43: Multi-Profile Transition (NETWORK)

## 🎯 Goal

Transform the user account system into a multi-role ecosystem where a "Cliente" can seamlessly apply for or switch to "Profissional" or "Unidade Fixa" roles without creating multiple accounts.

## 🏗️ Architecture decisions

- **Role Hierarchy**: A user can have multiple role-specific profiles (`Profissional`, `Cartorio`) linked to their primary `User` record.
- **Active Role**: The `user.role` field in the database acts as the _primary/active_ role, but we'll introduce logic to allow switching if the secondary profiles exist.
- **Data Persistence**: Role-specific data (equipment, CNPJ, etc.) is stored in its respective model (`Profissional` or `Cartorio`).

## 🛠️ Requirements

### R1: "Seja um Parceiro" (Join as Partner)

- [ ] Add a prominent "Seja um Parceiro" section in the `MinhaContaPage.tsx`.
- [ ] Implement a modal/stepper to choose between "Profissional (Fotógrafo/Editor)" and "Unidade Fixa (Franchisee/Cartório)".
- [ ] Collect initial data: Equipment (Professional), CNPJ (Units), and **Profile Photo** (Required for all partners).

### R2: Backend Role Upsert Logic

- [ ] `POST /auth/apply-role`: Validates the user's current status and creates/updates the secondary profile (`Profissional` or `Cartorio`).
- [ ] Update `User` model to include `profileImageUrl`.
- [ ] Automatic status tracking: New applications start as `isVerified: false`. Dashboard access is locked until admin approval.

### R3: Role Switcher & Onboarding

- [ ] Modify `Navbar.tsx` and `AuthContext` to support a "Role Switcher" if the user has more than one active profile.
- [ ] Implement a **Welcome Landing Page** (`/welcome-partner`) for newly approved partners.
- [ ] Implement a **Guided Tour** (with tooltips/popups) to explain the dashboard tools.

### R4: Unified Dashboard

- [ ] Implement a logic to "Switch Dashboard" in the user menu.
- [ ] Update `AuthProvider` to handle role-swapping without re-login (optional, or force a session refresh).

## ✅ Acceptance Criteria

- A user registered as CLIENTE can fill out a form and become a PROFISSIONAL (pending validation).
- Users with multiple roles can see a "Trocar de Perfil" option in the Navbar.
- Switching profiles updates the menu links and redirects to the correct dashboard (e.g., from `/minha-conta` to `/profissional`).
- Data consistency: Profile completion rewards (from Phase 42) are still tracked at the base `User` level.

## 🗓️ Traceability

| REQ-ID     | Feature              |
| ---------- | -------------------- |
| PROFILE-01 | Join as Partner Flow |
| PROFILE-02 | Backend Upsert Logic |
| PROFILE-03 | Role Switcher UI     |
