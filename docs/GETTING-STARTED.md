<!-- GSD:GETTING_STARTED -->
# Getting Started: Foto Segundo

Welcome to the Foto Segundo development guide. Follow these steps to set up your local environment and get the platform running.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js:** >= 20.x
- **npm:** Comes with Node.js
- **PostgreSQL:** Access to a Supabase instance or local Postgres.
- **Git:** For version control.

## Installation Steps

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/entrelenteselugares/foto-segundo.git
   cd foto-segundo
   ```

2. **Install Root Dependencies:**

   ```bash
   npm install
   ```

3. **Install Module Dependencies:**

   ```bash
   npm install --prefix backend
   npm install --prefix frontend
   ```

4. **Environment Configuration:**
   Copy the example environment file and fill in the required keys (see [CONFIGURATION.md](CONFIGURATION.md) for details).

   ```bash
   cp .env.example .env
   ```

5. **Database Initialization:**
   Generate the Prisma client.

   ```bash
   npx prisma generate --schema=backend/prisma/schema.prisma
   ```

## First Run

To start both the backend and frontend development servers simultaneously, run:

```bash
npm run dev
```

The application will be available at:

- **Frontend:** `http://localhost:3000` (Vite configured)
- **Backend:** `http://localhost:3002`

## Common Setup Issues

- **Prisma Connection Error:** Ensure `DATABASE_URL` is correct and your IP is whitelisted in Supabase.
- **Vite Port Conflict:** If port 5173 is occupied, Vite will pick another port. Check the terminal output.
- **OAuth Callbacks:** Ensure your Google Cloud Console redirect URIs match your local `BACKEND_URL`.

## Next Steps

Once the system is running, explore these documents for more details:

- [ARCHITECTURE.md](ARCHITECTURE.md) — Deep dive into system design.
- [DEVELOPMENT.md](DEVELOPMENT.md) — Guidelines for contributing code.
- [TESTING.md](TESTING.md) — How to run and write tests.
- [API.md](API.md) — Backend endpoint reference.
