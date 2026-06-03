---
status: resolved
trigger: "Multiple 404 and 500 errors on /api/admin/* endpoints in production Vercel deployment"
symptoms:
  expected: "Admin endpoints should load successfully and return 200 OK."
  actual: "Various /api/admin/* endpoints (phygital, crm, finance, coupons, ambassadors) return 404 Not Found or 500 Internal Server Error in production."
  error_messages: "AxiosError: Request failed with status code 404 / 500."
  timeline: "Started immediately after the latest Vercel deployment with esbuild."
  reproduction: "Open the Admin dashboard in the production Vercel URL."
---

# Resolution

root_cause: "The Vercel deployment uses esbuild, which ignored TypeScript compilation errors. Several Prisma queries in the backend were referencing fields/relations that didn't exist in the Prisma schema (e.g., `recoverySentAt` instead of `abandonedEmailSentAt`, and `payoutSettlements`), causing Prisma to throw errors at runtime (500). Furthermore, several Admin routes were completely missing from the `routes/index.ts` map (404)."
fix: "1. Replaced `recoverySentAt` with the correct `abandonedEmailSentAt` field in CRM controller/service. 2. Removed invalid `payoutSettlements` query filter from Finance Hub. 3. Added missing endpoints (`listCoupons` and `listAmbassadors`) to `GrowthController`. 4. Registered all missing routes in `routes/index.ts`."
verification: "TypeScript compilation passes, and endpoints are now correctly bound."
files_changed: "crm.controller.ts, crm.service.ts, finance_hub.controller.ts, growth.controller.ts, phygital.controller.ts, routes/index.ts"
