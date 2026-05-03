# Phase Plan: 08 - B2B Hub (Automação de Insumos & Networking)

## 📋 Wave 1: Data Infrastructure & Inventory Logic
- [ ] **DB Schema Expansion:**
    - Update `FranchiseProfile` to include `inventoryAlertThreshold` (e.g., alert at 50 photos) and `lastSupplyOrder`.
    - Ensure `User` model has a `referralCode` unique field.
- [ ] **Backend: Predictive Supply Engine:**
    - Implement logic in `SupplyService` to query `PhygitalPrint` counts and subtract from `FranchiseProfile.printCredits`.
    - Create a background check for low-stock triggers (Alert generation).
- [ ] **Backend: B2B Referral Logic:**
    - Implement `ReferralService` to generate unique invite links.
    - Update signup logic to detect `ref` parameters and create entries in `ProfessionalNetwork`.
    - Prepare database hooks for future split distribution between Platform/Photographer/Franchisee.

## 📋 Wave 2: Frontend Franchise Dashboard
- [ ] **UI: Franchise Hub Shell:**
    - Create `src/pages/franchise/Dashboard.tsx` with high-density "Midnight Luxury" cards.
    - Implement real-time status indicator for the local Printer Agent.
- [ ] **UI: Inventory Widget:**
    - Progress bars for print credits.
    - "Low Stock" alert banners with "Reorder Now" triggers.
- [ ] **UI: Referral Widget:**
    - Copy-to-clipboard referral link generator.
    - List of referred professionals with their verification status.

## 📋 Wave 3: Order Engine Integration & Alerts
- [ ] **Integration: 1-Click Supply Reorder:**
    - Create a specialized `createSupplyOrder` endpoint in `OrderController`.
    - Auto-fill items (Paper, Ink, Credits) based on franchise tier.
- [ ] **Automation: WhatsApp Supply Alerts:**
    - Integrate `SupplyService` with the WhatsApp notification queue to alert franchisees of critical levels.

## 📋 Wave 4: Verification & UAT
- [ ] **UAT: Referral Flow:** Verify professional is correctly linked to franchisee after signup via link.
- [ ] **UAT: Inventory Alert:** Manually deplete credits to verify alert triggering.
- [ ] **UAT: Reorder Flow:** Verify 1-click reorder creates the correct `Order` entry for Matriz review.

## 📝 Verification Command
```bash
npx ts-node .planning/phases/08-b2b-hub/verify_franchise_flow.ts
```
