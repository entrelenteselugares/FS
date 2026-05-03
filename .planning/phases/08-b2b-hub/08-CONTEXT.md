# Phase Context: 08 - B2B Hub (Automação de Insumos & Networking)

## 🎯 Phase Objective
Establish a centralized B2B operational hub for franchisees to manage supplies, grow their professional network via referrals, and monitor real-time printer performance within the "Midnight Luxury" ecosystem.

## 🏗 Key Components
1. **Supply Monitor (Phygital Inventory):**
   - Automated monitoring of `PhygitalPrint` usage.
   - Low-stock alerts (Visual & WhatsApp) for credits and paper.
   - Integration with Order Engine for 1-click supply reordering.

2. **Referral Engine (B2B Growth):**
   - Personalized referral links for franchisees.
   - Automated linking of referred professionals to the franchisee's `ProfessionalNetwork`.
   - Credit incentives for successful onboardings.

3. **Performance Dashboard (Printer Hub):**
   - Real-time status of the `Printer Agent`.
   - Aggregated volume metrics (Daily/Weekly/Monthly).
   - Franchise credit balance visualization.

## 🛠 Tech Stack
- **Backend:** Node.js, Prisma (New models/fields for inventory), WhatsApp API.
- **Frontend:** Next.js (New Franchise Dashboard), Tailwind CSS.
- **Design System:** Midnight Luxury (Tokens: `brand-tactical`, `lux-card`).

## 📊 Success Criteria
- [ ] Franchisee can see real-time printer status on their dashboard.
- [ ] Automated alert is triggered when print credits fall below 10%.
- [ ] Referral link successfully creates a `ProfessionalNetwork` entry for new signups.
- [ ] 1-click reorder flow generates a pending supply order in the system.
