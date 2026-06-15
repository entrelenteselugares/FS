# 02. Technology Stack & Integrations - Foto Segundo

Detailing the core technologies and third-party integrations powering the Foto Segundo ecosystem.

## 🟢 Frontend Stack

- **Framework**: React 19 (compiled via Vite 8)
- **Styling**: TailwindCSS 3 + Custom Vanilla CSS for luxury dark-mode aesthetics (Barlow Condensed typography, Outfit fonts, glassmorphism design tokens).
- **Animations**: Framer Motion 12 (used for app-like bottom navigation transitions, carousels, modal overlays, and micro-interactions).
- **Routing**: React Router 7.
- **Charts**: Recharts 3.8 (used for admin/franchise/partner financial analytics).
- **Icons & QR**: Lucide React + `qrcode.react` (used to generate scan-and-buy tickets and banners).
- **Utilities**: `date-fns` for event date formatting and calculations.
- **Telemetry**: Sentry Browser/React 10.52 for tracking client-side runtime errors.

---

## 🔵 Backend Stack

- **Runtime**: Node.js 24+
- **Web Server**: Express 5.2 (handling public and admin/partner/pro protected API endpoints).
- **Database Access**: Prisma ORM 6.19 (PostgreSQL client integration).
- **Security & Session**: JSON Web Token (JWT) + `bcryptjs` for encryption.
- **Media Processing**: `sharp` 0.34 (used to optimize uploaded images, add watermarks, and generate thumbnails server-side).
- **File Upload Handler**: `multer` 2.1 (configured for local/temp storage before S3 or Google Drive synchronization).
- **Telemetry**: Sentry Node 10.52 for backend crash and stack trace logging.

---

## 🔗 Core Third-Party Integrations

### 1. Payment Processing (Mercado Pago)

- **PIX & Credit Card**: Primary gateway for checkouts.
- **Split Payouts**: Programmatic splits between Franchise/Cartório, Photographer, and Master platform.
- **Vault Subscriptions**: Handles monthly recurring billing webhooks for long-term vault subscriptions.

### 2. Media Storage (AWS S3 & Google Drive)

- **AWS S3**: Real-time high-throughput storage for client-facing photos, optimized previews, and user-facing assets.
- **Google Drive OAuth Integration**: Connected via `GoogleDriveService`. Professionals can connect their personal Google Drive to sync or archive high-res files into digital "Memory Vaults".

### 3. Messaging (WhatsApp Attendant)

- **Baileys Integration**: Enables a direct connection to a WhatsApp instance.
- **Automated AI Attendant**: Uses the Google Gemini model integration to interact with consumers via WhatsApp, answer questions, provide links to orders, and handle general inquiries.

### 4. Search & Mapping

- **Proximity Search**: Uses geolocation data to allow clients to locate photographers and studios operating nearby.
