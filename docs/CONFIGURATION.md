<!-- generated-by: gsd-doc-writer -->
# Configuration Guide

Configuration for Foto Segundo is managed primarily through environment variables and a few database/local storage settings.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | **Required** | None | Connection URL with pooler for Prisma Client in runtime (e.g. Supabase port 6543) |
| `DIRECT_URL` | **Required** | None | Direct connection URL for running Prisma migrations (e.g. Supabase port 5432) |
| `MP_ACCESS_TOKEN` | **Required** | None | Mercado Pago Access Token for the platform account |
| `MP_WEBHOOK_SECRET` | **Required** | None | Security token for receiving IPN notifications from Mercado Pago |
| `JWT_SECRET` | **Required** | None | Symmetric key used to sign and validate session tokens |
| `SMTP_HOST` | Optional | None | SMTP server host for sending emails |
| `SMTP_PORT` | Optional | 587 | SMTP server port |
| `SMTP_USER` | Optional | None | SMTP username |
| `SMTP_PASS` | Optional | None | SMTP password |
| `FRONTEND_URL` | **Required** | None | Base URL for the frontend application (used in emails) |
| `STORAGE_PROVIDER` | Optional | `local` | Storage provider driver (`local`, `s3`, `gdrive`) |

## Config File Format

The system relies on `.env` files located in the `backend/` and `printer-agent/` directories.

```env
DATABASE_URL="postgresql://user:pass@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host:5432/postgres"
JWT_SECRET="your-32-char-secret"
# ... other variables
```

## Required vs Optional Settings

- Database and Mercado Pago credentials are **Required**. Missing them will cause API crashes on startup or during checkout.
- Email (`SMTP_*`) variables are **Optional**. If missing, the system will not send emails but core functions will run.

## Defaults

By default, `STORAGE_PROVIDER` assumes a local fallback (`local`), but for production it's set to `gdrive`.

## Per-environment Overrides

1. Copy `.env.example` to `.env` in the respective subdirectories.
2. In production (Vercel), environment variables are set in the Vercel Project Settings.
3. Database split matrix config is managed dynamically in the `PlatformConfig` database table to allow split overrides without redeploys.

## Print Settings (Local Storage)

Print engine configuration is persisted in the browser's `localStorage` per event using keys like `fs_print_settings_${eventId}`.

```json
{
  "borderEnabled": false,
  "borderWidth": 5,
  "borderColor": "#ffffff",
  "logoEnabled": true,
  "logoPosition": "bot-right",
  "photoSize": "10x15",
  "copies": 1
}
```

<!-- GSD-DOCS-UPDATE: SUPPLEMENTED -->
*Documentação verificada e atualizada automaticamente via GSD-SDK em 2026-06.*
