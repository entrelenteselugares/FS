# Phase 69: Checkout Frictionless - Implementation Plan

This phase focuses on improving the checkout experience to reduce abandonment and provide a native-app-like feel.

## Proposed Changes

### 1. Cart Synchronization & Recovery (CHECK-01)

Currently, `CartContext` already saves items in `localStorage`. However, navigating to `/checkout` without an active order shows a "Recuperar Carrinho" screen. We will streamline this:

- **`frontend/src/contexts/CartContext.tsx`**: Ensure synchronization continues locally.
- **`frontend/src/pages/CheckoutPage.tsx`**: Streamline the recovery mode. When entering the checkout with items in the cart but no active `orderId`, auto-generate the pending order using the `localStorage` data without requiring an extra click on "Finalizar Agora", making the transition from "Cart" to "Payment" frictionless.

### 2. Google Pay Integration via Mercado Pago (CHECK-02)

- **`frontend/src/pages/CheckoutPage.tsx`**: Modify the Mercado Pago Brick initialization settings to explicitly enable **Google Pay**.
- We will update the `customization.paymentMethods` object within the MP Brick settings to include wallet options.

### 3. Intelligent Empty States (CHECK-03)

- **`frontend/src/hooks/useRecentAlbums.ts` [NEW]**: Create a custom hook to manage a `fs_recent_albums` array in `localStorage`. It will store the `eventId`, `title`, and `coverUrl` of the last 3 visited albums.
- **`frontend/src/pages/FlashUnlockPage.tsx` (and other album views)**: Integrate the hook to register the album visit when the page loads.
- **`frontend/src/pages/CheckoutPage.tsx`**: Update the "Empty Cart" UI. Instead of a generic "Voltar para a Vitrine" button, it will read the `fs_recent_albums` from `localStorage` and display up to 3 clickable cards pointing back to those specific albums.

## Verification Plan

### Manual Verification

1. **Empty Cart**: Clear the cart. Visit 2 different albums. Go to `/checkout`. Verify that the empty state shows the 2 albums as suggestions.
2. **Cart Sync**: Add items to the cart, close the tab, reopen, and verify items are still there. Click "Checkout" and ensure it seamlessly creates the order and loads the payment UI.
3. **Google Pay**: In the checkout payment UI, verify that the Google Pay option is available in the Mercado Pago Brick alongside PIX and Credit Card.
