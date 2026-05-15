# ROADMAP: B2B & White-Label Expansion

## Milestone v9.0 Summary

**Goal:** Empower franchisees and major partners with custom branding and advanced financial reporting to drive B2B growth.

**Phases:** 3
**Requirements Coverage:** 0% (0/0 mapped)

---

## Phase 39: B2B Tenant Data Layer & Settings (B2B)

**Goal:** Extend the user and event schemas to support tenant branding (logos, theme colors) and build the configuration UI for franchisees.

- [x] **B2B-01**: Database schema supports `tenantLogoUrl` and `tenantBrandColor` for `User` (Franchisee) and optionally overrides per `Event`.
- [x] **B2B-02**: Franchisee dashboard includes a "Customização de Marca" tab allowing logo upload (saved to storage) and color picker.
- [x] **B2B-03**: API endpoints created to securely fetch, update, and serve tenant branding configurations.

---

## Phase 40: White-Label Gallery Rendering (RENDER)

**Goal:** Ensure the end-client experience (Event, Checkout, Vault) dynamically respects the photographer/franchisee's branding.

- [x] **RENDER-01**: `EventPage.tsx` and `VaultDetailPage.tsx` dynamically consume `event.tenantBrandColor` and apply it to the CSS variable `--brand`.
- [x] **RENDER-02**: `<Navbar />` is modified to accept a `tenantLogoUrl` prop, substituting the "Foto Segundo" logo with the franchisee's logo.
- [x] **RENDER-03**: The Checkout flows (`CheckoutPage.tsx`) retain the white-label branding, ensuring end-to-end immersion for the customer.
- [x] **RENDER-04**: Fallback gracefully to default Foto Segundo branding if the franchisee lacks custom settings or if the account is standard.

---

## Phase 41: Advanced Financial Export & Franchise Intel (INTEL)

**Goal:** Deliver enterprise-grade reporting for franchisees to close their monthly books and monitor unit health.

- [x] **INTEL-01**: Create backend PDF and CSV generators for deep payout ledgers (detailing taxes, splits, and net volume per professional).
- [x] **INTEL-02**: Update Franchise dashboard with a "Fechamento" tab allowing date-range exports.
- [x] **INTEL-03**: Display unit-level cohort metrics (e.g., Conversion Rate over time) for the Franchisee to monitor their linked operations.

---

## Phase 42: Express Registration via QR Code (EXPRESS)

**Goal:** Create a frictionless onboarding flow for phygital capture users using email + password only.

- [x] **EXPRESS-01**: Integrated express registration form in `PhygitalCapture.tsx`.
- [x] **EXPRESS-02**: Backend support for email-only registration with auto-generated name.
- [x] **EXPRESS-03**: `profileComplete` tracking and global "Incomplete Profile" banner.
- [x] **EXPRESS-04**: Coupon reward system for profile completion.

---

## Traceability Matrix

| REQ-ID | Phase |
|--------|-------|
| B2B-01 | 39 |
| B2B-02 | 39 |
| B2B-03 | 39 |
| RENDER-01 | 40 |
| RENDER-02 | 40 |
| RENDER-03 | 40 |
| INTEL-01 | 41 |
| INTEL-02 | 41 |
| INTEL-03 | 41 |
| PROFILE-01 | 43 |
| PROFILE-02 | 43 |
| GAME-01 | 44 |
| GAME-02 | 44 |

---

## Milestone v10.0: Professional Network & Engagement

**Goal:** Transform the user profile into a growth engine by allowing role transitions and gamifying data completion.

**Phases:** 2

---

### [x] Phase 43: Multi-Profile Transition Network (DONE)

**Goal:** Enable users to apply for or switch between roles (Cliente, Profissional, Unidade) from a single account.

- [x] **PROFILE-01**: Backend: Multi-role session support & role-application endpoints.
- [x] **PROFILE-02**: UI: "Role Switcher" dropdown & "Welcome Tour" onboarding.
- [x] **PROFILE-03**: Identity: Mandatory profile photo upload & verification status.
- [x] **PROFILE-04**: Refactor: AuthContext for seamless role switching and state persistence.

---

### [x] Phase 44: Gamified Profile Completion (DONE)

**Goal:** Implement a high-conversion, stepper-based profile UI with real-time reward feedback.

- [x] **GAME-01**: Create `ProfileStepper.tsx` with progress bar and "Reward Unlocked" animations.
- [x] **GAME-02**: Integrate the "Novo Profissional" discovery survey during the client onboarding.

---

## Milestone v11.0: Professional Governance & Marketplace Alpha (DONE)

**Goal:** Enable administrative control over partner applications and provide public visibility for subscribed professionals.

**Phases:** 2

---

### [x] Phase 45: Admin Approval Hub (DONE)

**Goal:** UI for Master Admin to review/approve/reject Role Applications.

- [x] **GOV-01**: Admin dashboard tab for reviewing pending professional/unit applications.
- [x] **GOV-02**: Approve/Reject actions with automated status updates.
- [x] **GOV-03**: Audit log of administrative approvals.

---

### [x] Phase 46: Professional Showcase (DONE)

**Goal:** Public profile pages and directory for subscribed professionals.

- [x] **SHOW-01**: Public portfolio page for verified professionals.
- [x] **SHOW-02**: Gate public profiles behind active MRR subscription.
- [x] **SHOW-03**: Budget request flow with "preferred professional" selection prioritizing subscribed users.
