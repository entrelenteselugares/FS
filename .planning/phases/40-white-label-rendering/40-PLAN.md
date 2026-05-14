---
phase: 40
name: White-Label Gallery Rendering
milestone: v9.0
requirements: [RENDER-01, RENDER-02, RENDER-03]
depends_on: [39]
---

# Phase 40: White-Label Gallery Rendering

## Context
With the backend exposing `tenantLogoUrl` and `tenantBrandColor` per event, the frontend needs to dynamically apply these styles to the Event/Gallery and Checkout interfaces. This creates the white-label experience for the end-user.

## Tasks

### Task 1: Dynamic Brand Color Injection
**Files:** `frontend/src/pages/EventPage.tsx`, `frontend/src/pages/VaultDetailPage.tsx`, `frontend/src/pages/CheckoutPage.tsx`
- In `EventPage` and `VaultDetailPage`, after successfully fetching the `event` data from the API:
  - If `event.tenantBrandColor` exists, inject a dynamic `<style>` tag or update the `:root` CSS variables (specifically `--brand`) using a `useEffect`.
  - Ensure the fallback is the default tactical green (`#14b8a6`) if no custom color is defined.
  - Return the CSS variable back to default when the component unmounts.

### Task 2: Dynamic Logo Replacement
**Files:** `frontend/src/components/Header.tsx` (or inside the specific pages if they use a custom header)
- `EventPage` and `CheckoutPage` currently show the "Foto Segundo" logo.
- Pass `tenantLogoUrl` as an optional prop to the Header component or override it locally.
- If `tenantLogoUrl` is present, display it as an `<img>` with a max-height (e.g., `h-8` or `h-10`).
- If missing, render the standard "Foto Segundo" text/logo.

## Verification
- [ ] Navigating to a white-labeled event changes the buttons and highlights to the franchisee's color.
- [ ] Navigating to a white-labeled event displays the franchisee's logo in the header.
- [ ] Navigating away from the event or to a non-white-labeled event restores the default tactical green and Foto Segundo logo.
