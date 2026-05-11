# External Integrations - Foto Segundo

External services and APIs integrated into the platform's ecosystem.

## 💳 Financial & Payments
- **MercadoPago**: Primary payment gateway for PIX and Card transactions. Handles splitting and recurring subscriptions for franchisees.
- **Vindi**: (Legacy/Potential) Recurring billing engine.

## ☁️ Infrastructure & Storage
- **AWS S3**: Scalable object storage for high-resolution event photography.
- **Supabase**: PostgreSQL database management and potential Edge Function offloading.
- **Vercel**: Deployment platform for frontend (React) and backend (Express/Serverless).

## 📂 Cloud Data
- **Google Drive**: Integration for bulk media transfers and long-term storage sync (via `googleDrive.service.ts`).
- **Google Photos**: (Potential) API for direct media retrieval.

## 📧 Communication
- **Nodemailer**: Transactional emails for order confirmation and user onboarding.
- **WhatsApp**: (Conceptual/WAPI) Direct professional-to-client communication.

## 📡 Monitoring & Analytics
- **Sentry**: Real-time error tracking and performance monitoring for both Frontend and Backend.
- **Google Search Console**: SEO monitoring for public event pages.
