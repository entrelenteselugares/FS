# Testing Strategy - Foto Segundo

Comprehensive validation pipeline for high-stakes photography operations.

## 🧪 Testing Layers

1. **E2E (End-to-End)**:
   - Framework: **Playwright**.
   - Focus: Critical paths like Onboarding Robot and Marketplace Checkout.
   - Path: `/e2e/`.
2. **Integration (Backend)**:
   - Framework: **Jest**.
   - Focus: API responses, DB persistence, and service orchestrations.
   - Path: `backend/src/tests/integration.test.ts`.
3. **Resilience**:
   - Framework: **Jest**.
   - Focus: Handling of timeout, failed printer communication, and 500 restoration.
   - Path: `backend/src/tests/resilience.test.ts`.

## 🤖 Automated Robots

- **Onboarding Robot**: Simulates full user registration to detect friction in the production environment.
- **Fulfillment Robot**: (Planned) Simulates print queue processing to ensure Phygital integrity.

## 🚦 Quality Gates

- **UAT (User Acceptance Testing)**: Mandatory verification before merging changes to `main`.
- **Telemetry Monitoring**: Use of console logs in E2E scripts to trace execution in non-interactive environments.
