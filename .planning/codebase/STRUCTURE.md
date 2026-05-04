# Project Structure: Foto Segundo

## Root Directory

- `backend/`: Express server and core logic.
- `frontend/`: Vite + React application.
- `printer-agent/`: Local IoT printing service.
- `docs/`: Master documentation and technical guides.
- `.planning/`: GSD project state and codebase maps.

## Backend Layout (`backend/src/`)

- `controllers/`: Request handling and flow orchestration.
- `services/`: Business logic (Pricing, Gamification, Notifications).
- `lib/`: Shared utilities (Audit, Auth, Prisma, Supabase).
- `middleware/`: Security and validation filters.
- `routes/`: API endpoint definitions.

## Frontend Layout (`frontend/src/`)

- `pages/`: Primary route components (Admin, Cliente, Profissional, Unidade).
- `components/`: Modular UI elements (Common, Specific Dashboards).
- `contexts/`: Global state (Auth, Theme).
- `lib/`: API client and shared helpers.
- `styles/`: Global CSS and design system tokens.

## Data Schema (`backend/prisma/`)

- `schema.prisma`: Single source of truth for the database model.
- `seed.ts`: Initial data for development environments.
