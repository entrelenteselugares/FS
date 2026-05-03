# Integrations - Foto Segundo

## External APIs
- **Google Calendar API**: OAuth2 integration for professional scheduling and slot management.
- **Mercado Pago API**: Payment processing (Credit Card/Pix) for orders and credits.
- **CallMeBot (WhatsApp)**: Notification service for critical alerts (leads, sales, admin notifications).
- **Supabase Auth/DB**: Core identity management and relational data persistence.

## Internal Services
- **Printer Agent (IoT)**: Multi-platform agent (Windows/Linux) for automated physical photo printing (Poll-based, sequential queue).
- **Phygital Motor**: Image processing engine using Sharp for SVG overlays and reference codes.
- **Order Engine (Unified)**: Centralized logic for Marketplace, Budgets, and Totems, managing payment models and item fulfillment.

## Data Flows
- **Web-to-Print**: Client Order -> Backend Queue -> IoT Agent -> Local Printer.
- **Sync Agenda**: Professional Profile -> Google OAuth -> CalendarSlot Sync -> Frontend Booking.
- **Finance Split**: Purchase -> Mercado Pago IPN -> Order Update -> Split Calculation (Matriz/PRO/Edição/Franchise) -> Escrow Engine.
- **Passive Income**: Referral Link -> Professional Onboarding -> Linked Franchisee -> 5% Automated Split on Sales.
