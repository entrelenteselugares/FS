# Gamification & Loyalty Engine

This document outlines the mechanics used to drive repeat usage and incentivize franchise growth through the **Midnight Luxury** design language.

## 1. Memory Vaults (Cofres de Memórias)

The core of our Phase 11 subscription model.

- **Concept**: A private, collaborative cloud for families and social groups.
- **Subscription**: Recurring monthly fee via Mercado Pago.
- **Materialization**: Exclusive CTA "Materializar Agora" converts digital storage into recurring physical print revenue.
- **Auto-Cleanup**: Automated archival of non-subscribed vaults after 12 months.

## 2. Cashback & Credits (UserSide)

- **RewardCredits**: A virtual currency earned on every B2B purchase.
- **Conversion**: 5% of every order returns to the user's wallet as credits for future photo purchases or prints.
- **Ledger**: Every transaction is recorded in `GamificationLedger` for auditability.

## 3. Franchise Tiers (GrowthSide)

Franchisees (Partners) progress through tiers based on total approved sales volume.

| Tier        | Requirement (Sales) | Benefits                                 |
| :---------- | :------------------ | :--------------------------------------- |
| **BRONZE**  | Startup             | Basic access, 10% commission             |
| **SILVER**  | 150 Sales           | 15% commission, priority support         |
| **GOLD**    | 500 Sales           | 20% commission, exclusive marketing kits |
| **DIAMOND** | 1000+ Sales         | VIP support, Matriz Co-op events         |

## 4. Engagement Mechanics

- **Double-Tap (Upcoming)**: High-engagement UI feature inspired by Instagram to "favorite" photos within galleries, feeding the sorting engine.
- **Instant Rewards**: Unlocking a "Flash Card" (Physical card with QR) triggers a celebration UI to boost dopamine during events.

## 5. Technical Implementation

- **Prisma Enums**: Tier and status management are strictly typed via Enums.
- **Calculated Fields**: Volume and tier progression are calculated in real-time or via daily cron jobs to update `FranchiseProfile`.
