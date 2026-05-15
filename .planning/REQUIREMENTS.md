# Milestone v12.0 Requirements: Unified Marketplace & Portfolio

## 1. Advanced Portfolio Galleries (PORT)
- [ ] **PORT-01**: User (Professional) can upload and manage high-quality image albums visible on their public profile.
- [ ] **PORT-02**: System automatically generates compressed thumbnails and watermarked previews for portfolio images.
- [ ] **PORT-03**: User (Client) can view professional portfolios in a seamless masonry gallery layout.
- [ ] **PORT-04**: User (Professional) can organize portfolio items into named categories/albums (e.g., "Casamentos", "Ensaios").

## 2. Automated Booking Escrow (ESCROW)
- [ ] **ESCROW-01**: User (Client) must pay a "Booking Fee" (Taxa de Reserva) via MercadoPago to unlock direct WhatsApp contact with a professional.
- [ ] **ESCROW-02**: System holds the booking fee in escrow and reflects it as "Pending" in the professional's balance.
- [ ] **ESCROW-03**: System automatically releases the booking fee to the professional's available balance upon service completion or after 7 days.
- [ ] **ESCROW-04**: System updates the budget request status (e.g., "Aguardando Pagamento", "Contato Liberado") in real-time via webhooks.

## 3. Proximity Search & Directory (SEARCH)
- [ ] **SEARCH-01**: User (Client) can search for professionals within a specific radius of their location using geolocation APIs.
- [ ] **SEARCH-02**: System filters professional search results based on geographic proximity, rating, and subscription status (verified PROs first).
- [ ] **SEARCH-03**: User (Professional) can update their service radius (in km) and base location in their profile settings.
- [ ] **SEARCH-04**: System provides a map-based or distance-based UI view for the professional directory.

---
## Out of Scope (This Milestone)
- In-app chat or messaging system (communication remains via WhatsApp after booking fee).
- Complex dispute resolution module for escrow (will handle via admin support).
- Video portfolio support.

---
## Traceability Matrix
| REQ-ID | Phase |
|--------|-------|

---
*Created: 2026-05-15 | Milestone v12.0*
