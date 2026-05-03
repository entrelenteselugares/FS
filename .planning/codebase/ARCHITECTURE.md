# Architecture - Foto Segundo

## Patterns & Principles
- **Monorepo-ish**: Unified repository containing `frontend`, `backend`, and `printer-agent`.
- **MVC (Backend)**: Controllers handle requests, Prisma models handle data, Services handle complex logic.
- **Component-Driven (Frontend)**: React components organized by feature and complexity.
- **RESTful API**: Standardized endpoints for cross-service communication.
- **IoT Integration**: Decoupled printer agent communicating via a dedicated API queue.

## System Components
1. **Frontend (Vite/React)**: High-density dashboards for Admins, Professionals, and Clients (Midnight Luxury theme).
2. **Backend (Express)**: Serverless-ready API with integrated financial split and escrow engine.
3. **Database (PostgreSQL)**: Managed via Supabase, accessed through Prisma ORM with $transaction support.
4. **IoT Agent**: Local Node.js service for physical printing automation at event sites.
5. **Unified Order Engine**: Centralized services (`PricingService`, `PaymentController`) for handling multi-channel sales and payouts.

## Deployment Strategy
- **Frontend/Backend**: Vercel (CI/CD linked to main branch).
- **Database**: Supabase (Production instance).
- **IoT**: Local execution at event sites.
