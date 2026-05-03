# Concerns - Foto Segundo

## Technical Debt
- **Legacy Code**: `infrastructure/legacy` contains unrefactored logic that may conflict with new theme tokens.
- **Any Types**: Remaining `: any` in less-frequented backend routes.
- **CSS Inconsistencies**: Some UI components might still use hardcoded zinc/hex colors (Midnight Luxury v3.1 audit is 90% complete).

## Performance
- **Heavy Galleries**: Large events (2k+ photos) can cause memory spikes if not properly virtualized.
- **Cold Starts**: Vercel serverless functions might experience latency on first request due to Prisma engine size.

## Reliability
- **IoT Connection**: Printer agent depends on stable local internet; lack of offline queue handling in agent v1.0.
- **Supabase Quotas**: Storage limits for high-resolution photo events.
- **Print Credits**: Franchisee inventory management for physical prints (preventing negative credits).

## Security
- **OAuth Tokens**: `user_calendar_credentials` are encrypted (AES-256-GCM verified).
- **Master Key**: `x-master-key` bypass must be strictly controlled in production.
- **Payout Fraud**: High-value payouts (>R$ 5.000) or unverified professionals trigger mandatory 7-day safety escrow.
- **Split Integrity**: Automated verification of split sums to prevent rounding leaks.
