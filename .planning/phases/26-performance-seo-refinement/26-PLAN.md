# Phase 26: Performance & SEO Refinement - PLAN

**Goal:** Otimizar a visibilidade social e performance da plataforma Foto Segundo.

## 🟢 Task 1: SEO & Metadata Implementation
- **File:** `frontend/src/components/SEO.tsx` (NEW)
- **Action:** Create a reusable SEO component using `react-helmet-async`.
- **Logic:** Handle `title`, `description`, `og:image`, and `og:url`.
- **File:** `frontend/src/pages/EventPage.tsx`
- **Action:** Replace existing `Helmet` logic with the new `SEO` component.
- **Action:** Pass `event.nomeNoivos` and `event.coverPhotoUrl` to the component.

## 🟢 Task 2: LCP & Performance Hardening
- **File:** `frontend/src/pages/EventPage.tsx`
- **Action:** Add `fetchpriority="high"` to the cover image `<img>`.
- **Action:** Ensure `loading="lazy"` is applied to all gallery photos below the fold.
- **Action:** Implement a small pre-fetching logic for the first 4 images in the gallery.

## 🟢 Task 3: Support & FAQ Page
- **File:** `frontend/src/pages/HelpPage.tsx` (NEW)
- **Action:** Implement the help page with *Midnight Luxury* styling.
- **Action:** Add sections for: Pagamentos (PIX), Entrega (Phygital), e Segurança.
- **File:** `frontend/src/App.tsx`
- **Action:** Register the `/ajuda` route.
- **File:** `frontend/src/components/Navbar.tsx`
- **Action:** Add a subtle link to "Ajuda" in the footer or menu.

## 🟢 Task 4: Proxy & Utility Refinement
- **File:** `frontend/src/lib/utils.ts`
- **Action:** Add a `getProxyUrl(driveId: string)` helper to centralize URL generation.
- **Action:** Ensure it points to the public proxy endpoint.

## 🧪 Verification Plan

### 1. SEO Validation
- [ ] Inspect source code on `EventPage` to verify `og:image` and `og:title` are correctly populated.
- [ ] Use a social link debugger (Open Graph Check) to verify card rendering.

### 2. Performance Validation
- [ ] Run Lighthouse report on an event page; verify LCP is flagged correctly with high priority.
- [ ] Check network tab to ensure lazy loading is working for lower grid items.

### 3. Functional Validation
- [ ] Navigate to `/ajuda` and verify layout consistency.
- [ ] Test the "Help" links in the Navbar/Footer.
