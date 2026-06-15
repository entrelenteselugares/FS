# 05. Frontend Structure & Navigation - Foto Segundo

Breakdown of the React Vite single-page application structure, routing scheme, and UI layout paradigms.

## 📁 Src Folder Structure

The frontend application code resides in `frontend/src/` organized as follows:

```
frontend/src/
├── api/             # Axios request configurations and API endpoint helpers
├── assets/          # Static images, vectors, and brand resources
├── components/      # Reusable atomic and structural UI components
│   ├── worldcup/    # Torcida Album related gamification components
│   ├── profissional/# Photographer specific components (e.g. PortfolioCarousel)
│   └── ui/          # Generic style wrappers (buttons, cards, loaders)
├── contexts/        # React Context providers (Auth, Theme, Cart, UploadQueue)
├── hooks/           # Custom React hooks (useAuth, useLocalStorage, etc.)
├── lib/             # Supabase & API utility clients
├── pages/           # High-level page views (e.g. EventPage, CheckoutPage)
│   ├── admin/       # Master control panel pages
│   ├── franchise/   # Regional Franchise Dashboard views
│   └── quote/       # Multi-step quotes checkout flow
└── styles/          # Custom layout systems and global theme overrides
```

---

## 🗺️ Routing Scheme (React Router 7)

Routes in `App.tsx` are managed with role-based visibility guards (`ProtectedRoute`):

- **Guest Routes**:
  - `/login`, `/registro` / `/register`, `/forgot-password`, `/reset-password`
  - `/invitation/:code` (Ambassador/Affiliate onboarding)
- **Shared Protected Routes**:
  - `/`: HomePage
  - `/e/:slug`: Event Page (puxa fotos do evento, portfólio do fotógrafo, checkout rápido)
  - `/cotacao/*`: Multi-step checkout wizard (Packages, Fixed Partners, or Custom Services)
  - `/checkout/:orderId`: Mercado Pago checkout overlay
  - `/minha-conta`: Cliente Area / User dashboard (orders, likes, point redemptions)
- **Role-Restricted Dashboards**:
  - `/admin/*`: Restricted to `ADMIN`
  - `/profissional/*`: Accessible by `ADMIN`, `PROFISSIONAL`, `FRANCHISEE`
  - `/unidade-fixa/*`: Accessible by `ADMIN`, `CARTORIO`, `UNIDADE`
  - `/franquia/*`: Accessible by `ADMIN`, `FRANCHISEE`

---

## 📱 Mobile-First PWA Configurations

Foto Segundo is built to act as a progressive web app (PWA) to accommodate event photographers and clients on-site:

- **App-like Navigation**: Uses `BottomNav.tsx` on smaller viewport sizes, styled to match native apps.
- **Capacitor Integration**: Features local listener bindings in `App.tsx` (`appUrlOpen`) to intercept deep links from external Google/Supabase OAuth redirect callbacks and close in-app browser tabs safely.
- **Service Worker (`sw.ts`)**: Caches static shell resources and allows basic offline operation.
