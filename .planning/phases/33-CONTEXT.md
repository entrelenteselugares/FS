# Phase 33 Context: Mobile-First & PWA implementation

## 🎯 Decisions

1. **PWA Library**: Use `vite-plugin-pwa`.
   - **Mode**: `generateSW`.
   - **Manifest**: Dark theme branding, icon maskable, "standalone" display.
2. **Offline Strategy**:
   - **Static Assets**: Precache all JS/CSS/Fonts.
   - **Images**: Cache selection thumbnails (Stale-While-Revalidate).
   - **Data**: Cache `/api/profissional/agenda` for offline viewing.
3. **Push Notifications**:
   - Infrastructure: Web Push API.
   - Keys: VAPID keys (Generate and save to `.env`).
4. **Touch Experience (Gallery Review)**:
   - **Multi-select**: Long-press to enter select mode + tap to toggle.
   - **Navigation**: Full-screen modal with horizontal swipe (framer-motion).
   - **Responsive Grid**: Dynamic columns (2 to 4) based on screen width.

## 🏗️ Technical Approach

- **Service Worker**: Auto-register via `vite-plugin-pwa`.
- **UI Components**:
  - Refactor `SelectionGallery.tsx` for touch events.
  - Implement `PushNotificationManager` component.
- **API**: Create `backend/src/controllers/push.controller.ts` for subscription management.

---

_Created: 2026-05-14 | Phase 33_
