---
phase: 39
name: B2B Tenant Data Layer & Settings
milestone: v9.0
requirements: [B2B-01, B2B-02, B2B-03]
depends_on: []
---

# Phase 39: B2B Tenant Data Layer & Settings

## Context
To support White-Label galleries, we need a way to store Franchisee (Tenant) branding preferences in the database and allow them to upload and change these settings via their dashboard.

## Tasks

### Task 1: Database Schema Updates
**File:** `backend/prisma/schema.prisma`
- Add `tenantLogoUrl` (String?) and `tenantBrandColor` (String?) to the `User` model. This will store the franchisee's default branding.
- Add `customLogoUrl` (String?) and `customBrandColor` (String?) to the `Event` model. This allows overriding the franchisee's default branding on a per-event basis (e.g., if a franchisee is covering a specific corporate event that demands the corporation's logo).
- Run `npx prisma db push` to apply the schema.

### Task 2: Backend API Endpoints for Tenant Settings
**File:** `backend/src/routes/index.ts` and `backend/src/controllers/user.controller.ts` (or similar)
- Create an endpoint `PATCH /api/users/me/tenant-branding` to update the user's `tenantLogoUrl` and `tenantBrandColor`.
- Create a public endpoint or update `GET /api/events/:id` to ensure it returns the `tenantLogoUrl` and `tenantBrandColor` of the event's owner (if `customLogoUrl`/`customBrandColor` are not set on the event).

### Task 3: Franchisee Dashboard UI - Branding Tab
**File:** `frontend/src/pages/franchise/FranchiseDashboard.tsx` (or a dedicated settings component)
- Add a new tab or section: "Customização de Marca" (White-Label Settings).
- Create a UI to upload a logo image (using the existing upload to S3/Drive/Cloudinary utility) and save the URL.
- Create a color picker input for `tenantBrandColor` (saving a hex code like `#14b8a6`).
- Send the updated values to `PATCH /api/users/me/tenant-branding`.

## Verification
- [ ] Prisma schema is successfully pushed.
- [ ] The franchisee can change their primary color and upload a logo in the dashboard.
- [ ] Refreshing the dashboard persists the saved logo and color.
- [ ] Fetching an event returns the inherited tenant branding data.
