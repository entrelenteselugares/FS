# Phase 69: Checkout Frictionless - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning
**Source:** Interactive discussion

<domain>
## Phase Boundary

- **What:** Deliver a frictionless checkout experience by implementing robust cart persistence, instant 1-click payments (Google/Apple Pay), and intelligent empty states.
- **Why:** To minimize cart abandonment and increase conversion rates, particularly on mobile devices.
- **Boundaries:** Focuses entirely on the checkout UI/UX and payment integration. Does NOT include adding new payment gateways beyond Mercado Pago (which currently powers the Pix integration), but rather adding Wallet integration to the existing gateway.
  </domain>

<decisions>
## Implementation Decisions

### Cart Synchronization Strategy (CHECK-01)

- **Decision:** Local-first synchronization.
- **Rationale:** The cart items will be stored in `localStorage` and managed by a React Context/Store. A backend PENDING order is ONLY created when the user actually navigates to the Checkout page. This is faster for the user and prevents filling the database with abandoned draft orders.

### Digital Wallets (CHECK-02)

- **Decision:** Integrate Mercado Pago Wallet Bricks exclusively for **Google Pay**.
- **Rationale:** Apple Pay requires an Apple Developer account, which the user does not have yet. We will only implement the Google Pay button via Mercado Pago.

### Empty State Tracking (CHECK-03)

- **Decision:** Use `localStorage` to track the 3 most recently visited album IDs. This ensures the empty state suggestions work instantly, even for unauthenticated users (guests) before they login.
  </decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Platform

- `.planning/codebase/ORDER_ENGINE.md` — Defines the order structure and transaction types.
- `.planning/REQUIREMENTS.md` — Requirements for v15.0 Native Mobile Experience.
  </canonical_refs>

<specifics>
## Specific Ideas
- Use a `CartProvider` context to wrap the application, initializing its state from `localStorage` on boot.
- The `CheckoutPage.tsx` should read the `CartProvider` state, call an API to create the PENDING order, and then render the payment UI.
</specifics>

<deferred>
## Deferred Ideas
None
</deferred>
