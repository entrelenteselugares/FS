# Phase 74: Segurança e Proteção Financeira - Context

**Gathered:** 2026-06-15
**Status:** Ready for planning
**Source:** Security Audit Findings

<domain>
## Phase Boundary
This phase resolves security and mathematical vulnerabilities inside payments, IoT simulations, and escrow operations.
</domain>

<decisions>
## Implementation Decisions
- Move stress simulation authentication from a hardcoded string to `process.env.STRESS_TEST_KEY`.
- Impose a safety split floor (take-rate threshold) of 5% in the pricing service.
- Prevent automatic escrow release of service bookings with an active dispute flag.
</decisions>

<canonical_refs>

## Canonical References

- `backend/prisma/schema.prisma`
- `backend/src/controllers/phygital.controller.ts`
- `backend/src/services/pricing.service.ts`
- `backend/src/jobs/escrow-release.job.ts`
  </canonical_refs>
