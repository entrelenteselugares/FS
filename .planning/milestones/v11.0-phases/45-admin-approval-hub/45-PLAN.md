---
phase: 45
name: Admin Approval Hub
milestone: v11.0
requirements: [GOV-01, GOV-02, GOV-03]
depends_on: [43]
---

# Phase 45: Admin Approval Hub (GOV)

## Objective

Provide the Master Admin with a dedicated UI to review, approve, or reject incoming applications for the Profissional and Unidade Fixa roles.

## Context

When a user applies for a new role (Phase 43), they are marked as `isVerified: false`. Currently, manual database intervention is required to approve them. Phase 45 builds the admin interface to manage this workflow securely.

## Implementation Details

### 1. Backend: API Endpoints

- **GET /api/admin/applications**: Fetch a paginated list of pending (`isVerified: false`) Profissional and Unidade Fixa records, including the attached User profile.
- **PATCH /api/admin/applications/:id/approve**: Set `isVerified: true` and `verificationStatus: "APPROVED"`. Dispatch a notification/email to the user.
- **PATCH /api/admin/applications/:id/reject**: Set `verificationStatus: "REJECTED"`.

### 2. Frontend: Admin Dashboard Tab

- **AdminApprovalTab.tsx**: Add a new tab to the Master Admin dashboard.
- Display pending applications in a table or card grid.
- Show user details (Name, Email, Role requested, CNPJ/CPF, Portfolio links).
- Action buttons: ✅ Approve | ❌ Reject.

### 3. Audit Log (GOV-03)

- Create a simple audit log mechanism (e.g., a new `AuditLog` table or metadata in the approval action) to track _who_ approved _whom_ and _when_.
