<!-- generated-by: gsd-doc-writer -->

# 📸 Foto Segundo | Midnight Luxury Experience

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)

**Foto Segundo** é uma plataforma phygital de elite que redefine a entrega de fotografia profissional. Unindo a estética _Midnight Luxury_ com automação industrial de impressão e um motor completo de Growth & Retention, transformamos pixels em memórias físicas tangíveis — e conversões em receita recorrente.

A arquitetura do sistema agora suporta múltiplos verticais de negócios (Gastronomia, Náutico, Varejo) orquestrados por um robusto Painel de Controle 4-Tier. A plataforma também funciona como um Progressive Web App (PWA) Mobile-First, com navegação app-like, acesso nativo à câmera e notificações Push.

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

2. The application will be running with the API and frontend accessible.

## Core Features & Usage Examples

### 1. Phygital Capture & Live Print

Real-time syncing from camera devices directly to event galleries and print stations. A nova versão (v15.0) inclui **Offline Queue Persistence (IndexedDB) e Non-Blocking Background Uploads**, garantindo que a captura (Stories-like) funcione sem telas de loading, mesmo sem sinal 4G/Wi-Fi, retomando automaticamente.

```bash
POST /api/marketplace/events/:eventId/sync-drive
Authorization: Bearer <token>
```

### 2. Multi-Vertical Support

The adaptive UI engine dynamically switches modes depending on the current tenant and vertical. Flash Events can now be created by professionals seamlessly.

```bash
POST /api/profissional/flash-event
Authorization: Bearer <seu_token>
```

### 3. Premium Photo Printing Service

Integrated Web-to-Print functionality allowing users to request premium physical photo prints ("Serviço de Revelação") directly from their event albums or digital memory vaults, delivered directly to their homes.

### 4. Growth & Retention

Discount coupons, dynamic upselling through the marketplace checkout, and an integrated Ambassador network.

```bash
GET /api/marketplace/coupons/PROMO20/validate?eventId=<eventId>
```

## Infrastructure Scaling

The platform operates on a hybrid model to scale backend logic past Supabase Edge Function infrastructure limits using Vercel APIs and Hono fragmentation strategies.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on code standards, commit messages, and the GSD workflow.

## License

© 2026 Foto Segundo. All rights reserved.


<!-- GSD-DOCS-UPDATE: VERIFIED -->
_Documentação verificada e atualizada automaticamente via GSD-SDK em 2026-06-14._
