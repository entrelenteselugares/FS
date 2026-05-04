# System Integrations: Foto Segundo

## Financial Integrations (Unified Order Engine)

- **Mercado Pago**:
  - **Checkout Pro**: Hosted redirect for high-security transactions.
  - **Transparent API**: In-app credit card and PIX processing.
  - **Webhooks**: Automated order status synchronization via HMAC-signed notifications.
  - **Passive Split (B2B)**: Automated commission distribution for franchisees/partners using `PricingService`.

## Database & Infrastructure

- **Supabase**:
  - Managed PostgreSQL with Prisma ORM.
  - Storage Buckets (Bucket: `eventos`) for high-res media.
  - Real-time subscriptions for UI updates (Grid unlocking).

## Gamification & Loyalty

- **GamificationLedger**: Integrated audit trail for all reward credits.
- **Ambassador Program**: Automated point conversion for referred sales.

## Communication

- **WhatsApp (CallMeBot)**: Notification service for real-time sales, leads, and payment alerts.
- **Email (Nodemailer)**: Access link and receipt delivery.

## IoT / Phygital (Hardware Automation)

- **Printer Agent**: Node.js local spooler (Raspberry Pi/PC) for instant hardware print workflow.
- **Poll & Confirm Protocol**: Local agent polls backend queue, downloads media, and confirms physical output status.

## External Data

- **AwesomeAPI**: Real-time currency exchange for international meritocracy pricing.
