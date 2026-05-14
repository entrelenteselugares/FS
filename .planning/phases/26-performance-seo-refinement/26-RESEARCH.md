# Phase 26: Performance & SEO Refinement - RESEARCH

**Date:** 2026-05-13
**Domain:** Frontend (React, Vite, Helmet)

## 1. Dynamic Open Graph (OG) Tags
- **Current State:** `EventPage.tsx` uses `react-helmet-async` for the title.
- **Implementation:**
    - Add `og:title`, `og:description`, and `og:image` tags.
    - **Image Logic:** Use `event.coverPhotoUrl`. If it's a Google Drive link, use the existing proxy route `/api/vaults/media/proxy/:fileId` (need to ensure the proxy is public).
    - **Technical Debt:** The current proxy resides in `vaults.controller.ts`. We may need a generic public proxy for cover photos if they are stored in Drive.

## 2. Performance (LCP) Optimization
- **Cover Photo:** The large banner in `EventPage.tsx` is the primary LCP candidate.
    - Action: Add `fetchpriority="high"` to the `<img>` tag.
    - Action: Ensure the image is not blurred initially if possible, or use a low-res placeholder.
- **Gallery Grid:**
    - Action: Implement `react-window` or `react-virtuoso` if the grid grows too large (current implementation uses simple mapping).
    - Action: Optimize image sizes. Use the proxy to request smaller thumbnails instead of full-res images where possible.

## 3. SEO Standardization
- **Helmet:** Centralize metadata in a `SEO` component or ensure every page uses the `Foto Segundo | [Title]` pattern.
- **Robots.txt:** Ensure `/e/*` (public events) are indexable, while `/minha-conta` and `/profissional` are excluded.

## 4. Support Page (`/ajuda`)
- **Route:** Add to `App.tsx`.
- **Layout:** Use `Navbar` and a centralized container.
- **Reusable Styles:** Use `bg-theme-bg`, `text-theme-text`, and `border-theme-border`.
- **Sections:**
    - "Como funciona o Checkout PIX?"
    - "Prazos de Entrega (Produtos Físicos)"
    - "Segurança e Proteção de Dados"

## 5. Technical Patterns
- **SEO Component:** Create `frontend/src/components/SEO.tsx` to encapsulate Helmet logic.
- **Proxy Helper:** Create a utility to convert Drive IDs to Proxy URLs.

---
**Conclusion:** Implementation is straightforward. The main effort is in the CSS/Layout of the new Help page and the precise configuration of the Helmet tags.
