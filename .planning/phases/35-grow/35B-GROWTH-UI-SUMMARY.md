# Phase 35B Summary

## Accomplishments
- Added `couponCode` state and input field to `CheckoutPage.tsx`
- Handled the `/checkout/payment` request with `couponCode` and `affiliateId` payload
- Created `AdminGrowth.tsx` dashboard for coupons, affiliates, and WhatsApp
- Mapped WhatsApp status and QR Code connection flow
- Mapped Affiliates fetching and UI switch for payout type (`PIX` / `CREDIT`)

## User-facing changes
- Users can now input a coupon in the checkout modal.
- Users that have 100% discount from coupons can bypass MercadoPago.
- Admins can manage coupons, affiliates, and whatsapp sessions from `/admin/growth`.
