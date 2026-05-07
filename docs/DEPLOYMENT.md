<!-- generated-by: gsd-doc-writer -->
# Deployment Guide: Foto Segundo

This guide details the process of deploying the Foto Segundo platform to production and staging environments.

## Deployment Targets

The platform is designed for cloud-native deployment with a focus on serverless architecture for the API and static hosting for the frontend.

| Target | platform | Config File |
|--------|----------|-------------|
| **Frontend** | Vercel (Static) | `frontend/package.json` |
| **Backend API** | Vercel (Serverless) | `vercel.json`, `api/server-v2.js` |
| **Database** | Supabase (Managed) | N/A (Cloud Managed) |
| **Storage** | Google Drive | N/A (OAuth2 Integration) |

## Build Pipeline

Our CI/CD pipeline is managed via GitHub Actions.

1. **Trigger:** Push to `main` (Production) or `dev` (Staging).
2. **Lint & Test:** Runs `npm run lint` and `npm run test:e2e:all`.
3. **Build:**
    - Backend: Bundled via `esbuild` into `api/server-v2.js`.
    - Frontend: Built via Vite into `public/`.
4. **Deploy:** Automatic deployment to Vercel upon successful build and test pass.

## Environment Setup

Production deployment requires several critical secrets to be configured in the Vercel Dashboard:

- `DATABASE_URL` (Direct Supabase URL)
- `JWT_SECRET` (Production-grade secret)
- `MP_ACCESS_TOKEN` (Live credentials)
- `CALENDAR_ENCRYPTION_KEY` (64-char hex)
- `GOOGLE_DRIVE_REFRESH_TOKEN` (Persistent)

Refer to [CONFIGURATION.md](CONFIGURATION.md) for the full list of required variables.

## Rollback Procedure

In case of a critical failure:

1. **Vercel:** Use the Vercel Dashboard to "Redeploy" a previous successful deployment.
2. **Database:** If the schema was changed, a manual rollback via Prisma Migrations may be necessary (use with extreme caution).
3. **Hotfix:** Push a targeted fix to the `main` branch to trigger a new deployment.

## Monitoring

- **Error Tracking:** [Sentry](https://sentry.io) is recommended for capturing server-side exceptions.
- **Uptime:** [StatusCake] or [UptimeRobot] monitors the `/api/health` endpoint.
- **Logs:** Vercel Runtime Logs provide real-time visibility into serverless function execution.
- **Database:** Supabase Dashboard provides monitoring for query performance and connection counts.

<!-- VERIFY: Sentry DSN configuration in production -->
<!-- VERIFY: Vercel project deployment URL -->
