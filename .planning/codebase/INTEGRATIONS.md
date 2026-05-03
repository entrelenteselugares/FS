# Integrations - Foto Segundo

## External APIs
- **Google Calendar API**: OAuth2 integration for professional scheduling and slot management.
- **Mercado Pago API**: Payment processing (Credit Card/Pix) for orders and credits.
- **CallMeBot (WhatsApp)**: Notification service for critical alerts (leads, sales, admin notifications).
- **Supabase Auth/DB**: Core identity management and relational data persistence.

## Internal Services
- **Printer Agent (IoT)**: Multi-platform agent (Windows/Linux) for automated physical photo printing.
- **Phygital Motor**: Image processing engine using Sharp for SVG overlays and reference codes.
- **Unified Checkout**: Internal payment orchestration layer linking orders to gateways.

## Data Flows
- **Web-to-Print**: Client Order -> Backend Queue -> IoT Agent -> Local Printer.
- **Sync Agenda**: Professional Profile -> Google OAuth -> CalendarSlot Sync -> Frontend Booking.
- **Finance**: Purchase -> Mercado Pago IPN -> Order Status Update -> Franchise Credit Transaction.
