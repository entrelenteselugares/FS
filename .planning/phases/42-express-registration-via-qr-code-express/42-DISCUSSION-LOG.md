# Phase 42: Express Registration via QR Code — Discussion Log

**Date:** 2026-05-15
**Participants:** Antigravity (AI), User

## Summary of Decisions

### 1. API Strategy

- **User Preference:** Isolated endpoint.
- **Reasoning:** Decouples express flow from the complex standard registration, allowing users to define their profile (Pro, Client, etc.) later without side effects.
- **Decision:** Implement `POST /api/auth/register-express`.

### 2. Profile Completion Tracking

- **User Preference:** Antigravity's discretion.
- **Decision:** Add `profileComplete: Boolean` to the User model. It's more efficient for UI logic and allows for future business analytics on conversion rates.

### 3. Visual Feedback

- **User Preference:** "Bem visível" (Highly visible).
- **Decision:** Implement a sticky top-bar banner in the Navbar for users with `profileComplete: false`.

### 4. Reward System

- **User Preference:** "Sim" (presumably unique code).
- **Decision:** Generate a unique coupon code upon completion, show it on screen, and send via email.

## Deferred Ideas

- SMS/Social integration for express flow.
- Multiple reward tiers.
