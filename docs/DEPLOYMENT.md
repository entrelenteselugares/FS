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

Our CI/CD pipeline is managed via GitHub Actions and Vercel's native build engine.

1. **Trigger:** Push to `main` (Production) or `dev` (Staging).
2. **Pre-build:** Runs `npx prisma generate` to ensure type safety.
3. **Build Script:**
    - **Backend:** Bundled via `esbuild` into `api/server-v2.js` for serverless execution.
    - **Frontend:** Built via Vite into `frontend/dist`.
    - **Asset Sync:** The `public/` directory at the root is replaced with the fresh frontend build.
4. **Deploy:** Automatic deployment to Vercel. CI runs `npm test` before or during deployment.

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

- **Error Tracking:** Sentry is configured for capturing server-side exceptions (DSN via `VITE_SENTRY_DSN`).
- **Uptime:** UptimeRobot or StatusCake monitors the `/api/health` endpoint.
- **Logs:** Vercel Runtime Logs provide real-time visibility into serverless function execution.

## Cron Job Setup

The Growth Engine relies on external cron triggers for automation:

| Endpoint | Method | Frequency | Purpose |
|----------|--------|-----------|---------|
| `/api/cron/abandoned-carts` | `POST` | Every hour | Sends recovery emails/WhatsApp to users who abandoned checkout after 24h. |
| `/api/cron/crm-recovery` | `GET` | Daily | Full CRM lead recovery pass. |

**Configure via Supabase Cron or Vercel Cron:**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/abandoned-carts",
      "schedule": "0 * * * *"
    }
  ]
}
```

All cron endpoints require `Authorization: Bearer <CRON_SECRET>` header.

## Post-Deployment Sanity Check

1. **Health Check:** `GET /api/health` must return `200 OK`.
2. **Auth Flow:** Login must succeed (serial execution recommended).
3. **UI Integrity:** Verify "Bottom Navigation Bar" on mobile.
4. **Financial:** Test PIX generation.
5. **IoT:** Confirm Printer Agent heartbeats.
