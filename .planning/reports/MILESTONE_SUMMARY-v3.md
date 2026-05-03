# Milestone Summary: Ecosystem Expansion (v3)

## 1. Overview

Milestone 3 marks the transition of Foto Segundo from a single-vendor platform to a multi-channel Marketplace B2B2C. The focus was on enabling franchisee autonomy (B2B Hub) and automating financial flows (Split Engine).

## 2. Architecture

- **Unified Order Engine**: A centralized service layer that handles multiple sales channels (Marketplace, Budget, Express, Totem).
- **Passive Split Logic**: Integrated commission splitting (5%) for referring franchisees.
- **IoT Resilience**: Poll-based printer agent with sequential queueing for on-site reliability.

## 3. Completed Phases

- **Phase 08: B2B Hub**: Implemented supply monitoring, franchisee dashboards, and referral networking.
- **Phase 09: Split de Comissões**: Refactored the payout engine to support automated multi-party splits and escrow policies.

## 4. Key Decisions

- **Backend-Only Pricing**: To ensure security and precision, all financial calculations were moved from the Frontend to the `PricingService` in the Backend.
- **Prisma Transactions**: Mandatory use of `$transaction` for all financial operations to ensure atomicity.
- **Hybrid Testing**: Adopted "Penny Testing" (real PIX transactions) to validate the production webhook and split logic.

## 5. Technical Debt & Concerns

- **Print Credit Monitoring**: Need to implement a stricter guardrail for negative print credits in the franchisee dashboard.
- **Rounding Precision**: Continuous monitoring of split sums is required to avoid 1-cent leaks in high-volume transactions.

## 6. Getting Started (For New Devs)

1. Read `docs/ORDER_ENGINE.md` to understand the transaction flow.
2. Read `docs/FINANCE_SPLITS.md` for commission rules.
3. Use `npm run dev` to start the local environment and refer to `e2e/finance/hybrid-penny-pix.spec.ts` for integration testing.

## 7. Next Steps

- **Phase 10: Gamification v2**: Implementing incentives and points redemption.
- **Phase 11: Public Launch**: Scaling for multi-event concurrent loads.
