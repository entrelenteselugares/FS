# 10. Operations & Deployment Guide - Foto Segundo

Standard procedures for local development, environment configurations, and production deployments.

## 💻 Local Setup & Development

Both backend and frontend are hosted within the single repository.

### Prerequisites

- Node.js 24+
- PostgreSQL database instance (local or Supabase)

### Installation

From the project root:

```bash
# Install root dependencies
npm install

# Build backend and install client packages
cd backend && npm install
cd ../frontend && npm install
```

### Running Locally

To launch both frontend and backend development servers simultaneously, execute from the root directory:

```bash
npm run dev
```

- **Frontend URL**: `http://localhost:5173`
- **Backend API URL**: `http://localhost:3000`

---

## 💾 Database Operations (Prisma)

Any modifications to `schema.prisma` require migrating the database:

```bash
cd backend

# Create and apply migration
npx prisma migrate dev --name <migration_name>

# Re-seed static catalog services & configurations
npx prisma db seed
```

---

## 🔒 Environment Configurations

### Backend `.env`

Required variables for the serverless backend deployment:

- `DATABASE_URL`: Connection string to primary PostgreSQL DB.
- `DIRECT_URL`: Direct link to Postgres for migration operations.
- `JWT_SECRET`: Secret hash token for user sessions.
- `MP_ACCESS_TOKEN`: Mercado Pago production credentials.
- `CRON_SECRET`: Random security key verifying Vercel Cron routes.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`: Storage configuration.
- `WA_WORKER_URL`, `WA_SECRET_KEY`: Connection parameters for the WhatsApp AI attendant.

### Frontend `.env`

- `VITE_API_URL`: Root path of the Express API (e.g. `https://foto-segundo-api.vercel.app`).
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`: Client authorization tokens.

---

## 🚀 Production Deployment (Vercel)

Foto Segundo uses Vercel for continuous integration.

### Deployment CLI Commands

To force deploy updates directly from the local terminal using the correct team scopes:

```bash
# Login/Authenticate with Vercel CLI
vercel login

# Trigger Production Deploy (scoped to fotosegundo team)
vercel --prod --yes --scope fotosegundo
```

- **Production Alias**: [foto-segundo.vercel.app](https://foto-segundo.vercel.app)
