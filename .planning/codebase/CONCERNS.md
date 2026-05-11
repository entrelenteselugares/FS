# Technical Concerns & Risks - Foto Segundo

Critical areas requiring ongoing monitoring and defensive engineering.

## 🔴 High Priority

- **Printer Agent Connectivity**: Potential for stale connections in local IoT agents affecting Phygital fulfillment.
- **Production 500 Errors**: Fragility in Vercel serverless function timeouts during heavy image processing (Sharp).
- **Onboarding Friction**: Automated registration flows sometimes fail due to async race conditions in the local dev environment.

## 🟡 Medium Priority

- **Location Data Quality**: Inconsistent CEP-based location strings in legacy event records (Mitigated by current sanitization filters).
- **Financial Reconciliation**: Complexity in multi-split payments (Master/Franchise/Profissional) requiring manual audits.
- **Media Asset Storage Cost**: Growth of high-res photos on S3 requiring lifecycle policies (e.g., transition to Glacier).

## 🟢 Monitoring Gaps

- **Real-time UX Observability**: Need for better session replay (e.g., LogRocket or PostHog) to debug specific user failures in the vitrine.
- **Phygital Queue Latency**: Better telemetry for the time elapsed between "Buyer Clicks" and "Printer Starts".
