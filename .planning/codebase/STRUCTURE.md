# Codebase Structure - Foto Segundo

Physical organization of the repository.

## 📂 Root

- `backend/`: Server-side logic.
- `frontend/`: Client-side React application.
- `infrastructure/`: Database migrations, shared scripts, and test helpers.
- `e2e/`: Playwright E2E test suite.
- `printer-agent/`: Local service for printer communication.
- `.planning/`: GSD documentation and architectural records.

## 📂 Backend (`backend/src/`)

- `controllers/`: Request handling and response mapping.
- `services/`: Business logic and external API orchestrations.
- `middleware/`: Authentication, authorization, and sanitization.
- `routes/`: Express route definitions.
- `prisma/`: DB Schema and migrations.
- `tests/`: Integration and resilience test suites.

## 📂 Frontend (`frontend/src/`)

- `components/`: Modular UI elements categorized by role (Admin, Profissional, etc.).
- `pages/`: Page-level components and routing targets.
- `hooks/`: Custom React hooks for auth and global state.
- `lib/`: API clients (Axios) and design system tokens.
- `assets/`: Static media and global styles.
