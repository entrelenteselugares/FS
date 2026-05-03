# Structure - Foto Segundo

## Core Directories
- `frontend/`: React application.
  - `src/pages/`: Route-level components.
  - `src/components/`: Reusable UI elements.
  - `src/lib/`: API clients, theme definitions, and utilities.
  - `src/hooks/`: Custom React hooks for state and data fetching.
- `backend/`: Node.js Express server.
  - `src/controllers/`: Request handlers.
  - `src/routes/`: API route definitions.
  - `prisma/`: Database schema and migrations.
  - `scripts/`: Maintenance and data seeding scripts.
- `printer-agent/`: IoT Printing service.
- `infrastructure/`: Database, legacy code, and logs.
- `.planning/`: GSD workflow and project state.
- `ANOTAÇÕES/`: Business and technical notes.

## Key Files
- `backend/prisma/schema.prisma`: Source of truth for the data model.
- `backend/src/services/pricing.service.ts`: Central logic for pricing and splits.
- `backend/src/services/phygital.service.ts`: IoT queue and image processing logic.
- `frontend/tailwind.config.js`: Design system and theme tokens.
- `api/server.js`: Compiled backend entry point for Vercel.
- `.agent/settings.json`: GSD configuration.
