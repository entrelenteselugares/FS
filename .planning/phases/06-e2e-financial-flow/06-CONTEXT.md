# Phase 06: Financial Security & Payout Logic - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning
**Source:** User Discussion (Anti-fraud & Financial Flow)

<domain>
## Phase Boundary
This phase implements the financial safety engine of the platform. It moves from a simple "pay and split" model to a risk-aware payout logic that protects the marketplace against malicious users and high-value fraud. It includes the "PRO/Verified" status logic and the Admin payout management interface.

</domain>

<decisions>
## Implementation Decisions

### 1. Photographer Verification Flow (PRO Status)
- **Hybrid Criteria:** To be promoted to "PRO", a user must:
  - Submit valid Documentation (CPF/CNPJ + Identity).
  - Reach a threshold of successful sales (e.g., 5 orders without disputes).
  - Receive Manual Approval from a platform Admin.
- **Impact:** Only PRO users are eligible for immediate automated splits (for low-risk transactions).

### 2. Escrow & Payout Logic
- **Retention Strategy:** For non-PRO users or high-risk transactions, the platform holds the total amount.
- **Auto-Release Trigger:** Funds are marked as "Available for Payout" automatically after `Event Date + 7 days`.
- **Risk Assessment:** The system automatically forces escrow if:
  - The photographer is not PRO.
  - The order value exceeds a configurable threshold (Default: R$ 5.000,00).

### 3. Admin Payout Interface
- **Pending Queue:** A new view in the Admin Dashboard listing all orders with "Pending Payout" status.
- **Manual Settlement:** Admin performs the manual Pix transfer and clicks "Mark as Paid" in the system to clear the record.
- **Audit Log:** Every payout action must be recorded in the system audit logs.

</decisions>

<canonical_refs>
## Canonical References
- `backend/prisma/schema.prisma` — Update `User` and `Order` models for PRO status and payout tracking.
- `backend/src/controllers/payment.controller.ts` — Inject risk logic into the Mercado Pago split calculation.
- `frontend/src/pages/admin/AdminFinance.tsx` — Implementation target for the payout queue.

</canonical_refs>

<specifics>
## Specific Ideas
- Add `isVerified` and `verificationDocs` fields to the User model.
- Add `payoutStatus` (PENDING, READY, PAID) and `escrowExpiresAt` to the Order model.

</specifics>

<deferred>
## Deferred Ideas
- Automated Pix API integration (direct payout via API) — to be handled in a future scaling phase.
- Dispute management system (arbitration UI).

</deferred>

---

*Phase: 06-financial-security*
*Context gathered: 2026-05-03*
