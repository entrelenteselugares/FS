# REVIEWS: Interdisciplinary Code Audit (Backend & Frontend)

**Phase:** 06 - Financial Security & Infrastructure
**Date:** 2026-05-03
**Status:** 🟡 ACTION RECOMMENDED

## 1. Backend Review (Node.js/Prisma)

### 🚨 Critical: Database Update Efficiency
- **Observation:** In `PaymentController.finalizeApprovedOrder`, there are 4+ sequential `prisma.event.update` calls for the same event record.
- **Impact:** Increases database latency and roundtrip overhead, especially on serverless (Vercel).
- **Recommendation:** Refactor into a single `prisma.event.update` with an accumulated `data` object.

### 🟡 Tech Debt: Hardcoded Business Rules
- **Observation:** Risk threshold (`5000`) and escrow window (`7 days`) are hardcoded in the controller logic.
- **Impact:** Difficult to change per-market or per-tier without code changes.
- **Recommendation:** Move to `.env` or a `SystemConfig` service.

### 🟢 Quality: User Creation Logic
- **Observation:** The auto-registration logic in `processPayment` is robust but repetitive across different payment methods.
- **Recommendation:** Extract into `UserService.provisionGuestAccount(email, metadata)`.

## 2. Frontend Review (React/Vite)

### 🟡 Tech Debt: Split Calculation Logic
- **Observation:** `AdminFinance.tsx` fallbacks to `amount * 0.4` for Matriz splits if the field is missing.
- **Impact:** Divergence between UI and DB truth.
- **Recommendation:** Always rely on `splitMatriz` from the backend; ensure backend fills this snapshot for legacy orders.

### 🟢 UX: Consistency & Performance
- **Observation:** Theme tokens (`brand-tactical`, `theme-bg-muted`) are correctly applied. Micro-animations (`animate-in`) provide a premium feel.
- **Recommendation:** Implement virtualization (`react-window`) in `AdminFinance` if order volume exceeds 50 items.

### 🟡 Maintenance: Shared Utilities
- **Observation:** Currency and date formatters are defined locally within the component.
- **Recommendation:** Move to `@/lib/utils/formatters.ts`.

## 3. Recommended Fix Plan (Wave 1)

| Priority | Area | Task |
|----------|------|------|
| HIGH | Backend | Batch event updates in `finalizeApprovedOrder`. |
| MEDIUM | Shared | Centralize formatting utils. |
| MEDIUM | Backend | Extract `SystemConfig` for financial thresholds. |
| LOW | Frontend | Implement list virtualization for payouts. |

---

## Next Steps
- [ ] Run `/gsd-plan-phase --reviews` to incorporate these fixes into a hardening phase.
- [ ] Approve the batching refactor for `PaymentController`.
