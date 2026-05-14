# Milestone v8.0 Requirements: MRR Engine — Monetização Recorrente

## 1. Subscription Data Layer (SUB)
- [ ] **SUB-01**: System creates a `Subscription` record linked to a Vault when a user initiates a recurring payment via Mercado Pago Preapproval API.
- [ ] **SUB-02**: System handles Mercado Pago subscription webhooks (authorized, paused, cancelled, charged_back) and updates subscription status accordingly.
- [ ] **SUB-03**: Vault has a `trialEndsAt` date set to 30 days after the event date, after which a valid subscription is required for access.
- [ ] **SUB-04**: System stores `preapprovalId`, `status`, `nextBillingDate`, and `planPrice` on the Subscription entity.

## 2. Vault Blocking Engine (BLOCK)
- [ ] **BLOCK-01**: Cron job identifies vaults with expired trials and no active subscription, and sets vault status to `BLOCKED`.
- [ ] **BLOCK-02**: Photo access is denied for vaults in `BLOCKED` status — API returns a structured error with subscription CTA.
- [ ] **BLOCK-03**: System sends email notification to vault owner at D-5 and D-1 before trial expiry.
- [ ] **BLOCK-04**: Vault is automatically reactivated (status → `ACTIVE`) within 1 hour of a successful subscription payment being confirmed.

## 3. Subscription UI (UI)
- [ ] **UI-01**: User sees a subscription CTA inside their vault when trial is within 5 days of expiry or already expired.
- [ ] **UI-02**: User can initiate a monthly subscription from the vault page, which redirects to Mercado Pago Preapproval checkout.
- [ ] **UI-03**: User can view their active subscriptions and billing date in their dashboard profile.
- [ ] **UI-04**: User can cancel an active vault subscription from their dashboard.

## 4. Admin & Metrics (ADMIN)
- [ ] **ADMIN-01**: Admin can view total active subscriptions count and estimated MRR in the financial dashboard.
- [ ] **ADMIN-02**: Admin can view a list of all subscriptions with status, vault, subscriber, and next billing date.

---
## Out of Scope (This Milestone)
- Multiple subscription tiers or pricing plans.
- Annual billing option.
- Stripe or any other payment gateway.
- Performance optimization, B2B franchisee portal, mobile camera features.

---
## Traceability Matrix
| REQ-ID | Phase |
|--------|-------|
| SUB-01 | 36 |
| SUB-02 | 36 |
| SUB-03 | 36 |
| SUB-04 | 36 |
| BLOCK-01 | 37 |
| BLOCK-02 | 37 |
| BLOCK-03 | 37 |
| BLOCK-04 | 37 |
| UI-01 | 38 |
| UI-02 | 38 |
| UI-03 | 38 |
| UI-04 | 38 |
| ADMIN-01 | 38 |
| ADMIN-02 | 38 |

---
*Created: 2026-05-14 | Milestone v8.0*
