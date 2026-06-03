# Phase 46: Professional Showcase (SHOW) - Implementation Plan

## 1. Domain

Public directory and profiles for subscribed professionals, with a booking fee (Taxa de Reserva) barrier to unlock direct contact.

## 2. Database Schema Updates

1. **Subscription Enhancements**:
   - Update `Subscription` model in `schema.prisma` to support Professional subscriptions by making `albumId` optional and adding `type` (VAULT vs PRO).
2. **Booking Model (`ServiceBooking`)**:
   - Create a `ServiceBooking` model to track the client's request to a professional.
   - Fields: `id`, `clienteName`, `clienteEmail`, `clientePhone`, `profissionalId`, `status` (PENDING, PAID, CANCELLED), `bookingFee` (Decimal), `packageDesc`, `createdAt`.
   - Relation to `Profissional`.

## 3. API Endpoints

1. **Directory Queries** (`GET /api/marketplace/profissionais`):
   - Returns a paginated list of professionals where their `User` has an active Pro subscription.
   - Filters: name, city, services.
2. **Public Profile** (`GET /api/marketplace/profissionais/:id`):
   - Returns public data (bio, portfolio, packages) for a specific professional. Does NOT return WhatsApp or email.
3. **Booking Initialization** (`POST /api/marketplace/book`):
   - Client selects a package and professional.
   - Creates a `ServiceBooking` and an `Order` for the booking fee (Taxa de Reserva).
   - Returns a Mercado Pago checkout link for the fee.
4. **Booking Webhook/Unlock**:
   - Leverage existing Order webhook. Once the fee is paid, updates the `ServiceBooking` status to PAID.
   - Sends an email/notification to both parties with their direct contacts (WhatsApp).

## 4. UI Components (Frontend)

1. **Public Directory Page (`/profissionais`)**:
   - A grid of professional cards showing their avatar, name, location, and main service.
   - Search bar and location filter.
2. **Public Profile Page (`/pro/:id`)**:
   - Banner, Avatar, Bio.
   - Carousel of portfolio images.
   - List of available packages with a "Solicitar Reserva" button.
3. **Booking Flow (Checkout)**:
   - A modal or page where the client confirms the package and pays the "Taxa de Reserva".
4. **Budget Form Integration**:
   - Add the autocomplete field "Tem algum profissional de preferência?" in the generic budget form, fetching from `/api/marketplace/profissionais`.

## 5. Execution Steps

- **Step 1: Schema & DB**: Update `schema.prisma` with `ServiceBooking` and `Subscription` changes. Run `npx prisma db push`.
- **Step 2: API Services**: Implement `MarketplaceController` for directory and profile endpoints.
- **Step 3: Booking Engine**: Implement checkout logic for the booking fee, using existing Mercado Pago integrations.
- **Step 4: Directory UI**: Build `/profissionais` page and search functionality.
- **Step 5: Profile UI**: Build the public profile page and booking modal.
- **Step 6: Routing & Verification**: Ensure non-subscribed pros don't show up in public search. Add "Go Pro" upsell in the professional dashboard.
