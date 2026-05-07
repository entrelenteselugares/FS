<!-- generated-by: gsd-doc-writer -->
# Configuration Guide: Foto Segundo

This document details the environment variables and configuration settings required to run the Foto Segundo platform in development and production environments.

## Environment Variables

The system uses a `.env` file for local development. In production, these should be configured in your hosting platform's (e.g., Vercel) environment settings.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | **Yes** | — | The URL of your Supabase project. |
| `SUPABASE_ANON_KEY` | **Yes** | — | Supabase anonymous API key for public access. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | — | Supabase service role key for administrative bypass. |
| `DATABASE_URL` | **Yes** | — | Prisma connection string for Supabase PostgreSQL (use with PGBouncer). |
| `DIRECT_URL` | **Yes** | — | Direct Prisma connection string for Supabase PostgreSQL (use for migrations). |
| `JWT_SECRET` | **Yes** | — | Secret key used to sign and verify JSON Web Tokens. |
| `JWT_EXPIRES_IN` | No | `7d` | Expiration time for JWT sessions. |
| `MP_PUBLIC_KEY` | **Yes** | — | Mercado Pago public key for frontend integration. |
| `MP_ACCESS_TOKEN` | **Yes** | — | Mercado Pago private access token for server-side payments. |
| `MP_CLIENT_ID` | **Yes** | — | Mercado Pago application Client ID. |
| `MP_CLIENT_SECRET` | **Yes** | — | Mercado Pago application Client Secret. |
| `MP_REDIRECT_URI` | **Yes** | — | Webhook callback URL for payment notifications. |
| `GOOGLE_CLIENT_ID` | **Yes** | — | Google Cloud OAuth2 Client ID for Calendar/Drive. |
| `GOOGLE_CLIENT_SECRET` | **Yes** | — | Google Cloud OAuth2 Client Secret. |
| `GOOGLE_CALENDAR_REDIRECT_URI` | **Yes** | — | Callback URI for Google Calendar authentication. |
| `CALENDAR_ENCRYPTION_KEY` | **Yes** | — | 32-byte hex key for encrypting OAuth tokens in the database. |
| `GOOGLE_DRIVE_REDIRECT_URI` | **Yes** | — | Callback URI for Google Drive authentication. |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | **Yes** | — | Persistent refresh token for the Master Drive account. |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | **Yes** | — | ID of the root folder in Google Drive for photo storage. |
| `CALLMEBOT_PHONE` | No | — | Phone number for WhatsApp notifications via CallMeBot. |
| `CALLMEBOT_APIKEY` | No | — | API key for CallMeBot WhatsApp service. |
| `PORT` | No | `3001` | Port number for the backend Express server. |
| `BACKEND_URL` | No | `http://localhost:3001` | Base URL of the backend API. |
| `CRON_SECRET` | **Yes** | — | Secret token to secure internal cron/maintenance endpoints. |

## Required vs Optional Settings

### 🛑 Startup Blockers

The application will fail to initialize or perform core functions if the following are missing:

- **Database:** `DATABASE_URL` and `DIRECT_URL` must be valid for Prisma to connect.
- **Auth:** `JWT_SECRET` must be set to issue session tokens.
- **Financials:** `MP_ACCESS_TOKEN` is required for processing any sales.
- **Storage:** `GOOGLE_DRIVE_REFRESH_TOKEN` is required for the Memory Vaults and photo fulfillment.

### ⚙️ Optional Defaults

- **Port:** Defaults to `3001` if not specified.
- **JWT Expiry:** Defaults to `7d` (7 days).
- **Notifications:** WhatsApp alerts will be skipped if `CALLMEBOT` variables are absent.

## Financial Split Configuration

The system uses internal constants (or environment overrides if implemented) for transaction splits:

| Variable | Value | Description |
|----------|-------|-------------|
| `TAXA_CARTORIO` | `0.10` | Percentage for the local franchise. |
| `TAXA_MATRIZ` | `0.40` | Percentage for the platform headquarters. |
| `TAXA_FOTOGRAFO` | `0.30` | Percentage for the capturing professional. |
| `TAXA_EDITOR` | `0.20` | Percentage for the post-production editor. |

## Per-Environment Overrides

### Local Development

- Uses `.env` or `.env.local`.
- `MP_REDIRECT_URI` and `GOOGLE_*_REDIRECT_URI` usually point to `localhost`.

### Production (Vercel)

- Environment variables must be set in the Vercel Dashboard.
- **CRITICAL:** Ensure `CALENDAR_ENCRYPTION_KEY` is a 64-character hex string (32 bytes).
- Set `NODE_ENV=production`.
