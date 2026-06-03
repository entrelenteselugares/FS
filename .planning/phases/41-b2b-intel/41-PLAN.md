---
phase: 41
name: Advanced Financial Export & Franchise Intel
milestone: v9.0
requirements: [INTEL-01, INTEL-02, INTEL-03]
depends_on: [40]
---

# Phase 41: Advanced Financial Export & Franchise Intel

## Context

With the white-label branding functioning correctly, Franchisees now need enterprise-grade reporting to monitor the financial health of their local operations. Phase 41 introduces CSV export capabilities for payouts and cohort intelligence to track conversions across their networked professionals.

## Tasks

### Task 1: Backend CSV Export (INTEL-01)

**Files:** `backend/src/controllers/finance_hub.controller.ts` or `franchise.controller.ts`, `backend/src/routes/index.ts`

- Create an endpoint `GET /api/franchise/finance/export`.
- This endpoint should fetch the transactions, splits, and payouts related to the Franchisee's `franchiseProfile` and their connected professionals.
- Use a robust library like `json2csv` to stream or return the CSV data detailing gross sales, taxes, gateway fees, and net payouts.

### Task 2: Franchise Dashboard Fechamento Tab (INTEL-02)

**Files:** `frontend/src/pages/franchise/FranchiseDashboard.tsx`

- Add a "Fechamento" (Financial Closing) section or button within the dashboard.
- Implement date-range pickers if applicable or simply export "Month to Date".
- Connect the export button to the new CSV endpoint and trigger a browser download.

### Task 3: Unit-Level Intelligence Dashboard (INTEL-03)

**Files:** `frontend/src/pages/franchise/FranchiseDashboard.tsx`

- Enhance the `getFinanceStats` or `getNetwork` endpoint to return basic cohort metrics, such as:
  - Total events performed by network.
  - Conversion rate (Orders / Total Events or Views).
- Display these KPIs visually in the `FranchiseDashboard.tsx`.

## Verification

- [ ] Exporting a CSV generates a properly formatted file with the financial splits.
- [ ] The dashboard successfully queries and displays conversion metrics for the franchisee's network.
