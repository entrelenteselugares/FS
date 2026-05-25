<!-- generated-by: gsd-doc-writer -->
# 📸 Foto Segundo | Midnight Luxury Experience

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)

**Foto Segundo** é uma plataforma phygital de elite que redefine a entrega de fotografia profissional. Unindo a estética *Midnight Luxury* com automação industrial de impressão e um motor completo de Growth & Retention, transformamos pixels em memórias físicas tangíveis — e conversões em receita recorrente.

## Installation

```bash
# Clone the repository
git clone <repository_url>
cd foto-segundo

# Install root dependencies
npm install

# Install module dependencies
npm install --prefix backend
npm install --prefix frontend

# Configure environment variables
cp .env.example .env

# Generate Prisma Client
cd backend && npx prisma generate
```

## Quick Start

1. Start both frontend and backend development servers simultaneously:

```bash
npm run dev
```

1. The application will be running with the API and frontend accessible.

## Usage Examples

### 1. Create a Flash Event

```bash
POST /api/profissional/flash-event
Authorization: Bearer <seu_token>
Content-Type: application/json

{
  "nome": "Casamento Silva & Santos",
  "data": "2026-06-15",
  "local": "Villa Borghese"
}
```

### 2. Apply Discount Coupon

```bash
GET /api/marketplace/coupons/PROMO20/validate?eventId=<eventId>
```

### 3. Sync Google Drive

```bash
POST /api/marketplace/events/:eventId/sync-drive
Authorization: Bearer <token>
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

© 2026 Foto Segundo. All rights reserved.
