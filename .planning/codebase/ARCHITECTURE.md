# Architecture - Foto Segundo

## Patterns & Principles
- **Monorepo-ish**: Unified repository containing `frontend`, `backend`, and `printer-agent`.
- **MVC (Backend)**: Controllers handle requests, Prisma models handle data, Services handle complex logic.
- **Component-Driven (Frontend)**: React components organized by feature and complexity.
- **RESTful API**: Standardized endpoints for cross-service communication.
- **IoT Integration**: Decoupled printer agent communicating via a dedicated API queue.

## System Components
1. **Frontend (Vite/React)**: High-density dashboards for Admins, Professionals, and Clients.
2. **Backend (Express)**: Serverless-ready API deployed on Vercel.
3. **Database (PostgreSQL)**: Managed via Supabase, accessed through Prisma ORM.
4. **IoT Agent**: Local service for physical printing automation.

## Deployment Strategy
- **Frontend/Backend**: Vercel (CI/CD linked to main branch).
- **Database**: Supabase (Production instance).
- **IoT**: Local execution at event sites.
