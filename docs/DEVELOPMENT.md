<!-- GSD:DEVELOPMENT -->
# Development Guide: Foto Segundo

This document outlines the development workflow, coding standards, and build processes for the Foto Segundo platform.

## Local Setup

Development requires a hybrid setup where the backend acts as an API server and the frontend is a Vite-powered SPA.

1. Follow the [Getting Started](GETTING-STARTED.md) guide for installation.
2. Ensure your `.env` file is fully populated, especially `JWT_SECRET` and `SUPABASE_*` keys.
3. Run `npm run dev` to start the development environment with HMR (Hot Module Replacement).

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts backend (3002) and frontend (3000) in parallel using `concurrently`. |
| `npm run build` | Bundles backend and builds frontend for production. |
| `npm run test` | Executes the main test suite (mapped to `test:e2e:all`). |
| `npm run test:certify` | Runs the high-integrity launch certification robot. |
| `npx prisma generate` | Regenerates the Prisma client for backend models. |
| `npm run lint` | (Frontend) Runs ESLint across the UI codebase. |

## Code Style

- **TypeScript:** The project is strictly typed. Avoid `any` where possible.
- **Linting:** We use standard TypeScript/JavaScript linting. Run `npm run lint` (if configured) before committing.
- **Theme (Midnight Luxury):** All frontend components must adhere to the design tokens defined in `frontend/src/index.css`.
- **Naming:**
  - Backend: `camelCase` for variables/functions, `PascalCase` for classes/controllers.
  - Frontend: `kebab-case` for file names, `PascalCase` for React components.

## Branch Conventions

We follow a feature-branch workflow:

- `main` — Production-ready code.
- `dev` — Integration branch for new features.
- `feat/*` — New features.
- `fix/*` — Bug fixes.
- `docs/*` — Documentation updates.

## Pull Request Process

1. Create a branch from `dev`.
2. Implement your changes and ensure `npm run build` passes locally.
3. Run existing E2E tests to ensure no regressions: `npm run test:e2e:all`.
4. Submit a PR to the `dev` branch.
5. All PRs require at least one approval and a passing CI build (if applicable).
