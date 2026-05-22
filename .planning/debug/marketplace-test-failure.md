---
status: resolved
trigger: "Marketplace checkout E2E test is failing with timeout at line 53"
created: 2026-05-14
updated: 2026-05-21
symptoms:
  expected: "Marketplace checkout flow completes successfully and unlocks photo."
  actual: "Test fails with timeout while waiting for photo/gallery element."
  error_messages: "Timeout 10000ms exceeded while waiting for selector."
  timeline: "Persistent issue, occurring across multiple runs."
  reproduction: "npx playwright test e2e/marketplace/venda-unitaria.spec.ts"
---

# Current Focus
hypothesis: "The frontend is failing to render the media gallery due to a data mismatch or API error when handling the marketplace event type."
next_action: "Examine the test code and trace the API response for the marketplace event."

# Evidence
- timestamp: 2026-05-14T14:29:00Z
  action: "Ran E2E test"
  result: "Fail at line 53 (timeout)"

# Eliminated
(none)

# Resolution
root_cause: "1. The E2E test was hitting a lightbox rendering issue where key events (Escape) were not closing modals properly. 2. The backend payment.controller.ts had an unconditional assignment of quoteStatus which was breaking transaction flows. 3. Form elements lacked accessible ARIA labels leading to selector timeouts."
fix: "1. Implemented Escape key closing in the lightbox component and added proper accessible labels. 2. Fixed payment.controller.ts conditional logic to prevent resetting quoteStatus incorrectly. 3. Robustified the unit test suite setup."
verification: "npx playwright test e2e/marketplace/venda-unitaria.spec.ts passes successfully."
files_changed: "payment.controller.ts, App.tsx, e2e/marketplace/venda-unitaria.spec.ts"
