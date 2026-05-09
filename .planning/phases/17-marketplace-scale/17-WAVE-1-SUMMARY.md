# Wave 1 Summary: Database Schema & Backend Core (Referral Engine)

## Completed Tasks
- ✅ **Prisma Schema Update**: Added `ReferralCampaign`, `ReferralVisit`, and `ReferralConversion` models. Extended `FranchiseProfile` with `capacityFlags` and `servedZipPrefixes`.
- ✅ **Database Sync**: Executed `npx prisma db push` to synchronize Supabase/PostgreSQL.
- ✅ **ReferralService**: Implemented logic for registering visits, processing conversions, and applying rewards (credits) via `GamificationLedger`.
- ✅ **ReferralController**: Created handler for `/embaixador/:slug` with 30-day cookie attribution (`fs_referral`) and stats endpoint.
- ✅ **Route Registration**: Integrated referral routes into the main API router.
- ✅ **Pricing Engine Extension**: Updated `PricingService` to handle ambassador commission splits, deducting the reward from the Matrix margin.
- ✅ **Payment Integration**: Updated `PaymentController` to capture `ambassadorId` from cookies during checkout and trigger reward processing upon payment approval.

## Technical Notes
- **Attribution**: Cookies are set with `httpOnly: true` and `sameSite: "lax"` for 30 days.
- **Financial Split**: The ambassador commission is calculated dynamically based on active campaign values and recorded in the order's financial snapshot.
- **Rewards**: Currently supports `CREDIT` rewards, which are automatically applied to the ambassador's balance and recorded in the gamification ledger.

## Verification
- Schema successfully pushed.
- Service logic implemented and integrated into the payment flow.
- Routes are active.
