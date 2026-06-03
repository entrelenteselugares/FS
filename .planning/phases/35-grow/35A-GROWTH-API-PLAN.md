---
wave: 1
depends_on: []
files_modified:
  - backend/prisma/schema.prisma
  - backend/src/controllers/growth.controller.ts
  - backend/src/services/growth.service.ts
  - backend/src/services/whatsapp.service.ts
  - backend/src/routes/index.ts
  - backend/src/jobs/abandonedCart.job.ts
autonomous: true
---

# Phase 35A: Growth Engine Backend (Coupons, Affiliates, Cart Recovery, WhatsApp)

## Objective

Implement the backend foundation for the Phase 35 Growth Engine. This covers generic coupon logic, 30-day affiliate tracking cookies with configurable payouts, 24-hour abandoned cart recovery, and a free-tier WhatsApp API integration (Evolution API / Baileys).

## Tasks

### 1. Update Database Schema

Implement the schema entities required for growth tracking.
<read_first>

- backend/prisma/schema.prisma
  </read_first>
  <action>
  Add the following models and fields to `backend/prisma/schema.prisma`:

1. `Coupon`: fields `id`, `code` (String, unique), `discountPercent` (Int), `active` (Boolean, default true), `createdAt`, `updatedAt`.
2. Add `couponId` (String, optional) to the `Order` model, referencing `Coupon`.
3. Add `affiliateId` (String, optional) to the `Order` model, referencing `User` (the ambassador).
4. Add `affiliatePayoutType` (String, default "CREDIT") to the `User` model, with options "CREDIT" or "PIX".
5. Add `abandonedEmailSentAt` (DateTime, optional) to the `Order` model to track recovery emails.
   </action>
   <acceptance_criteria>

- `backend/prisma/schema.prisma` contains `model Coupon` with `code` field.
- `backend/prisma/schema.prisma` contains `affiliatePayoutType` on `User`.
  </acceptance_criteria>

### 2. Implement Database Migration (Schema Push)

[BLOCKING] Update the live database to match the new schema.
<read_first>

- backend/prisma/schema.prisma
  </read_first>
  <action>
  Run `npx prisma db push --accept-data-loss` in the `backend` directory to apply the new schema fields for Phase 35. This task is NOT autonomous and requires manual execution.
  </action>
  <acceptance_criteria>
- Database schema matches the new Prisma schema.
  </acceptance_criteria>

### 3. Implement Coupon & Affiliate APIs

Create controllers and services to manage coupons and affiliate cookies.
<read_first>

- backend/src/routes/index.ts
  </read_first>
  <action>

1. Create `backend/src/services/growth.service.ts` to handle:
   - Validating a coupon code and returning the discount (rejecting if inactive).
   - Validating an affiliate ID to ensure the user exists and is active.
2. Create `backend/src/controllers/growth.controller.ts` with standard Express request handlers for:
   - `GET /marketplace/coupons/:code/validate`
   - `GET /marketplace/affiliates/:id/validate`
3. Update `backend/src/routes/index.ts` to map these new routes.
4. Modify `PricingService.calculateSplits` (or order creation logic) to accept `couponCode` and `affiliateId` and apply a single discount per order.
   </action>
   <acceptance_criteria>

- `backend/src/routes/index.ts` contains `router.get("/marketplace/coupons/:code/validate"`
- `backend/src/controllers/growth.controller.ts` exports `validateCoupon` method.
  </acceptance_criteria>

### 4. Implement WhatsApp Integration (Baileys/Evolution API stub)

Build the foundational service for WhatsApp messaging using an unofficial free tier.
<read_first>

- backend/package.json
  </read_first>
  <action>

1. Create `backend/src/services/whatsapp.service.ts`.
2. Implement a class `WhatsAppService` with methods:
   - `getQrCode()`: Returns the current pairing QR code as base64 (or a link).
   - `sendMessage(phone: string, message: string)`: Sends a text message to the specified number.
   - `getStatus()`: Returns whether the bot is connected.
3. Add a placeholder or actual implementation using `@whiskeysockets/baileys` (ensure to add it to package.json if not present) to connect and expose the QR code.
4. Expose Admin API endpoints in `growth.controller.ts`:
   - `GET /admin/whatsapp/status`
   - `GET /admin/whatsapp/qr`
     </action>
     <acceptance_criteria>

- `backend/src/services/whatsapp.service.ts` contains `class WhatsAppService` with `getQrCode` and `sendMessage` methods.
- `backend/src/controllers/growth.controller.ts` contains `getWhatsappQr` endpoint logic.
  </acceptance_criteria>

### 5. Abandoned Cart Recovery Cron

Implement the 24-hour delayed email trigger for pending orders.
<read_first>

- backend/src/services/notification.service.ts
  </read_first>
  <action>

1. Create `backend/src/jobs/abandonedCart.job.ts`.
2. Create a function `processAbandonedCarts()` that queries Prisma for `Order` records where:
   - `status` == 'PENDENTE'
   - `createdAt` is strictly <= 24 hours ago AND strictly >= 48 hours ago.
   - `abandonedEmailSentAt` is null.
3. For each found order, call `NotificationService.sendAbandonedCartEmail(order)`.
4. Update `order.abandonedEmailSentAt` to the current time to prevent duplicate sends.
5. Setup a basic `setInterval` or cron-job inside the backend entry point to run this function every hour.
   </action>
   <acceptance_criteria>

- `backend/src/jobs/abandonedCart.job.ts` exports `processAbandonedCarts`.
- Query specifically checks `abandonedEmailSentAt` is null.
  </acceptance_criteria>

## Verification

- Run `npx prisma generate` to verify schema changes.
- Ensure `processAbandonedCarts` only targets `PENDENTE` orders older than 24h.
- Verify WhatsApp service exports the required endpoints.
