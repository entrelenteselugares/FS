# Phase 06 Discussion Log

**Date:** 2026-05-03
**Phase:** 06 - Financial Security & Payout Logic

## Areas Discussed

### 1. Status "PRO" Verification

- **User Preference:** Hybrid (Manual + Performance + Documents).
- **Decision:** Photographers must submit KYC, have a history of sales, and get manual admin approval to be "PRO".

### 2. Escrow & Retention

- **User Preference:** Automatic release after event completion + safety window.
- **Decision:** Funds are held by the platform and released `Event Date + 7 days` (configurable).

### 3. Risk Assessment Logic

- **User Preference:** System-driven based on risk levels.
- **Decision:** Force escrow for non-PRO users OR transactions > R$ 5.000,00.

### 4. Admin Management

- **User Preference:** Manual payout queue.
- **Decision:** Implementation of a "Pending Payouts" table in Admin Finance with manual Pix confirmation.

## Deferred Items

- Automated Pix Payouts (API integration).
- Dispute resolution UI.
