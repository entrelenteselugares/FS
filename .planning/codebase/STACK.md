# Technical Stack: Foto Segundo

## Core Technologies

- **Frontend**: React (Vite) with TypeScript.
- **Backend**: Node.js (Express) with TypeScript.
- **Database**: PostgreSQL (Supabase) via Prisma ORM.
- **Deployment**: Vercel (Frontend & Backend).

## Design System

- **Theme**: Midnight Luxury (Dark mode, gold/brand-tactical accents).
- **Icons**: Lucide React.
- **Components**: Custom luxury-themed components with CSS Modules/Vanilla CSS.

## Data & ORM

- **ORM**: Prisma (client-side generation).
- **Storage**: Supabase Storage for event photos and profile assets.
- **Ledger**: GamificationLedger for immutable transaction history.

## Payments & Finance

- **Gateway**: Mercado Pago (Credit Card & PIX).
- **Engine**: PricingService for automated commission splits.

## Automation & IoT

- **Printer Agent**: Node.js local agent for phygital operations.
- **WebSocket/Polling**: For real-time print spooling.

## Testing

- **E2E**: Playwright (Full Regression Suite).
- **Unit**: Vitest (planned for core logic).
