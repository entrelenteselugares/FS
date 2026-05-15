# Phase 46: Professional Showcase — Context

## 1. Domain
Public profile pages and directory for subscribed professionals. Clarifies how users navigate the directory, how professional profiles are displayed, and the business logic gating direct contact.

## 2. Decisions Captured

### Search & Directory UI
- **Decision:** Implement a public directory page (`/profissionais`) listing all active, subscribed professionals.
- **Decision:** Add an autocomplete/search field in the budget request form ("Tem algum profissional de preferência?") for clients to select specific verified professionals by name or region.

### Profile Content & Contact Barrier
- **Decision:** Public profiles (`/pro/nome`) will showcase the professional's portfolio, bio, and packages.
- **Decision:** Direct contact (e.g., WhatsApp link) is strictly hidden from the public view to prevent platform bypass.

### Booking Mechanics (Taxa de Reserva)
- **Decision:** Contact unlocking uses a "Taxa de Reserva" (Booking Fee) model.
- **Decision:** Clients select a package defined by the professional and pay a fixed or percentage booking fee directly to Foto Segundo.
- **Decision:** Only after this payment is confirmed, the platform unlocks the professional's WhatsApp contact for the client to finalize details. Non-subscribed professionals can still receive system-dispatched jobs but lack public profiles.

## 3. Canonical References
- `ROADMAP.md` (Milestone v11.0, Phase 46)
