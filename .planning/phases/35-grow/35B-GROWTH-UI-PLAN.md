---
wave: 2
depends_on: ["35A-GROWTH-API-PLAN"]
files_modified:
  - frontend/src/pages/admin/AdminGrowth.tsx
  - frontend/src/pages/EventPage.tsx
  - frontend/src/components/CheckoutModal.tsx
  - frontend/src/pages/admin/AdminDashboard.tsx
autonomous: true
---

# Phase 35B: Growth Engine UI (Admin Panels & Checkout)

## Objective
Implement the frontend components for the Phase 35 Growth Engine, including the admin dashboard for managing WhatsApp, Coupons, and Affiliates, as well as applying coupons and tracking cookies in the user checkout flow.

## Tasks

### 1. Affiliate Cookie Tracking
Ensure that when users visit via an affiliate link, a 30-day cookie is stored.
<read_first>
- frontend/src/pages/EventPage.tsx
</read_first>
<action>
1. In `frontend/src/pages/EventPage.tsx` (or a global layout component), add a `useEffect` hook to parse the URL search parameters for `?ref=<affiliateId>`.
2. If `ref` exists, store the value in `localStorage` under the key `fs_affiliate_id` along with a timestamp representing expiration 30 days from now.
3. During checkout initialization in `CheckoutModal.tsx` or `EventPage.tsx`, retrieve `fs_affiliate_id`. If it has not expired, append it to the order payload when submitting the purchase.
</action>
<acceptance_criteria>
- `frontend/src/pages/EventPage.tsx` checks `searchParams.get('ref')` and sets `localStorage`.
- Order API payload includes `affiliateId` if a valid cookie is present.
</acceptance_criteria>

### 2. Checkout Coupon Integration
Allow consumers to input a generic coupon code and receive an instant discount validation.
<read_first>
- frontend/src/components/CheckoutModal.tsx
</read_first>
<action>
1. In `frontend/src/components/CheckoutModal.tsx` (or equivalent checkout flow component), add an input field for "Cupom de Desconto".
2. Add an "Aplicar" button that calls `GET /marketplace/coupons/:code/validate`.
3. If valid, store the applied `discountPercent` and the `couponCode` in the component state.
4. Update the total price calculation to deduct the `discountPercent`. Ensure the UI shows the original price crossed out and the new discounted total.
5. The `couponCode` must be sent in the final checkout POST payload.
</action>
<acceptance_criteria>
- `CheckoutModal.tsx` contains an input for coupon code.
- Validation API is called and total price updates based on discount.
</acceptance_criteria>

### 3. Admin Growth Dashboard
Create a central hub for administrators to configure all Growth Engine parameters.
<read_first>
- frontend/src/pages/admin/AdminDashboard.tsx
</read_first>
<action>
1. Create `frontend/src/pages/admin/AdminGrowth.tsx`.
2. Implement three primary tabs in this dashboard:
   - **Cupons**: A table to list active coupons, and a form to create a new coupon (Code, Discount %, Active toggle).
   - **Afiliados**: A list of users with the `AFILIADO` or `EMBAIXADOR` role. Add a dropdown/toggle next to each to select `affiliatePayoutType` ("CREDIT" ou "PIX").
   - **WhatsApp**: A section that fetches `GET /admin/whatsapp/status`. If disconnected, fetch `GET /admin/whatsapp/qr` and display the QR Code image for the admin to scan with their mobile device. If connected, show "Sessão Ativa".
3. Update `frontend/src/pages/admin/AdminDashboard.tsx` (or the main sidebar routing) to include a link to the new "Growth & Vendas" page.
</action>
<acceptance_criteria>
- `frontend/src/pages/admin/AdminGrowth.tsx` exports the new component with Cupons, Afiliados, and WhatsApp tabs.
- QR Code component correctly displays the base64 or image URL from the API.
- Sidebar menu contains a link to `AdminGrowth.tsx`.
</acceptance_criteria>

## Verification
- Admin dashboard correctly renders the three new tabs.
- The `ref` query parameter correctly triggers localStorage persistence.
- Checkout UI recalculates the visual total when a valid coupon is applied.
