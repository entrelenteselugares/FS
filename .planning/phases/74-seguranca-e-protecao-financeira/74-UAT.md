---
status: pass
phase: 74-seguranca-e-protecao-financeira
source: [74-SUMMARY.md]
started: 2026-06-15T19:10:00Z
updated: 2026-06-15T19:12:30Z
---

## Current Test

number: 4
name: Escrow Dispute Filter
expected: |
Run the escrow release script/endpoint with a booking that has hasActiveDispute set to true. The booking must remain in PAID status and not transition to RELEASED.
awaiting: none

## Tests

### 1. Cold Start Smoke Test

expected: Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query returns live data.
result: pass

### 2. Stress Test Key Security

expected: Accessing POST /api/phygital/simulate with x-master-key header containing FOTO_SEGUNDO_STRESS_2026 returns 401, while passing the value configured in process.env.STRESS_TEST_KEY or the development fallback (DEVELOPMENT_FALLBACK_STRESS_KEY) successfully processes the request.
result: pass

### 3. Matriz Split Floor

expected: Running a checkout that calculates splits where the Matriz platform fee falls below the 5% floor throws an error during the checkout process and blocks order creation.
result: pass

### 4. Escrow Dispute Filter

expected: Run the escrow release script/endpoint with a booking that has hasActiveDispute set to true. The booking must remain in PAID status and not transition to RELEASED.
result: pass

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
