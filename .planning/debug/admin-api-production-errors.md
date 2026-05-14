---
status: investigating
trigger: "Multiple 404 and 500 errors on /api/admin/* endpoints in production Vercel deployment"
symptoms:
  expected: "Admin endpoints should load successfully and return 200 OK."
  actual: "Various /api/admin/* endpoints (phygital, crm, finance, coupons, ambassadors) return 404 Not Found or 500 Internal Server Error in production."
  error_messages: "AxiosError: Request failed with status code 404 / 500."
  timeline: "Started immediately after the latest Vercel deployment with esbuild."
  reproduction: "Open the Admin dashboard in the production Vercel URL."
---

# Current Focus
next_action: "gather initial evidence"
