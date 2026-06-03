# PLAN: Phase 33 — Mobile-First & PWA implementation

## 1. Setup PWA Foundation

- [ ] **Install Dependencies**: `vite-plugin-pwa` in frontend.
- [ ] **Configure `vite.config.ts`**:
  - Add `VitePWA` plugin.
  - Define manifest (name, short_name, icons, colors).
  - Setup `workbox` caching rules for offline support.
- [ ] **Icons**: Deploy the generated premium icon in 192x192 and 512x512 sizes.

## 2. Offline Resilience

- [ ] **Precache Core**: Ensure all JS/CSS bundles are cached.
- [ ] **Gallery Cache**: Implement `StaleWhileRevalidate` for `*.(jpg|jpeg|png|webp)` under `/uploads/`.
- [ ] **Data Cache**: Implement `NetworkFirst` for `/api/profissional/agenda`.

## 3. Push Notifications Hub

- [ ] **VAPID Keys**: Generate server-side keys.
- [ ] **Backend Subscription**:
  - Create `PushSubscription` table/schema.
  - Endpoint `POST /api/push/subscribe` to save browser endpoints.
- [ ] **Frontend Registration**:
  - Implement `PushNotificationManager.tsx` to request permissions.
  - Subscribe user to the service worker.

## 4. Touch Gallery Total Review

- [ ] **Refactor `SelectionGallery.tsx`**:
  - Implement `react-use-gesture` or native touch events for multi-selection.
  - Add a "Mobile View" toggle or auto-switch.
  - Optimize grid layout for 2-column mobile view.
- [ ] **Navigation**: Enhance the full-screen photo modal with swipe-to-close and swipe-to-navigate.

---

## 🏁 Verification (UAT)

1. **PWA Install**: App can be installed on iOS/Android from Safari/Chrome.
2. **Offline Agenda**: Open Agenda, turn off internet, refresh -> Agenda still visible.
3. **Push Alert**: Send a test push from backend -> Notification received on device.
4. **Touch Flow**: Select 5 photos in the gallery using swipe gestures -> Works smoothly.

---

_Created: 2026-05-14 | Phase 33_
