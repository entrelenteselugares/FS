# PLAN: Phase 22 - Express Sale Access Refinement

## 1. Objective
Resolve the blank screen experience for customers after "Venda Rápida" (Express Sale) and optimize the access workflow through Magic Links and UI refinements.

## 2. Technical Strategy
- **Authentication**: Implement `guestToken` generation for every Express Sale.
- **Delivery**: Include the `guestToken` in a direct "Magic Link" within the welcome email.
- **Redundancy**: Maintain temporary password generation as a fallback for full account management.
- **Robustness**: Refactor `EventPage` and `EventController` to return metadata for private events instead of 403, allowing the UI to render properly before authentication.
- **UX**: Refine the Express Sale POS UI with a standardized "+" button and an improved service list.

## 3. Implementation Checklist

### 🟢 Wave 1: Backend Infrastructure (DONE)
- [x] **MarketplaceController**: Update `expressSale` to generate `guestToken` and include it in the `magicLink`.
- [x] **NotificationService**: Update `sendWelcomeEmail` to accept `magicLink` and render it as a primary CTA.
- [x] **EventController**: Update `getById` to return metadata for private events when access is restricted, nullifying only sensitive fields.

### 🟢 Wave 2: Frontend & UX (DONE)
- [x] **EventPage**: Refactor `step` logic to handle `hasAccess` flag from the backend and prevent blank screens.
- [x] **ExpressSaleModal**: Replace textual item buttons with a standardized "+" button and reveal the full service list upon expansion.

### 🟡 Wave 3: Verification (TODO)
- [ ] Verify Magic Link functionality via E2E test or manual verification.
- [ ] Verify that no blank screen occurs when accessing a private album without a token (should show AuthModal).
- [ ] Verify that the service list in ExpressSaleModal is searchable and functional.

## 4. Verification Plan (UAT)
1. **Magic Link Test**: Create an express sale, get the magic link from the logs/email, and access it in an incognito window.
   - *Expected*: Album header visible, photos visible (if paid) or vitrine/paywall visible, NO login required.
2. **Access Denied Test**: Access a private album URL without a token.
   - *Expected*: Album header visible, but a login modal or "Private Album" message appears instead of a blank screen.
3. **POS UX Test**: Open ExpressSaleModal, click "+", and select a service.
   - *Expected*: List appears, search works, item is added to cart correctly.
