# UAT Findings: Phase 12 - Audit and Payment Refinement

## Findings List

| ID | Description | Severity | File Refs | Status |
|----|-------------|----------|-----------|--------|
| F-01 | 401 Unauthorized on `/api/auth/me` in Vercel deployment | high | `backend/src/lib/auth.ts` | FIXED |
| F-02 | 404 Not Found on `POST /api/vaults/media/:mediaId/vote` | medium | `backend/src/routes/index.ts` | FIXED |
| F-03 | Order Audit UI missing event details (Title, Date, Location) | medium | `frontend/src/pages/admin/AdminOrders.tsx` | FIXED |
| F-04 | Vault media thumbnails returning 403 Forbidden on Vercel | high | `backend/src/services/googleDrive.service.ts` | FIXED (Restored scopes & permissions) |
| F-05 | Missing detailed order items and values in Admin Orders view | medium | `frontend/src/pages/admin/AdminOrders.tsx`, `backend/src/controllers/admin.controller.ts` | FIXED |
