# Phase 19 Plan: Quotes Kanban Redesign

**Phase:** 19 — Kanban Redesign da Gestão de Orçamentos
**Date:** 2026-05-10
**Status:** Ready to execute

---

## Scope

Refactor `frontend/src/pages/admin/AdminQuotes.tsx` (852 lines) into a Kanban board layout. Pure frontend UI/UX restructure — no backend changes.

---

## Wave 1 — Kanban Board Structure

**Task 1.1** — Replace the list+panel layout with a horizontal 5-column Kanban grid
- Define `KANBAN_COLUMNS` constant mapping status → label → color
- Render columns with `filteredByStatus()` helper grouping quotes per column
- Each column: header (label + count badge) + scrollable card list
- Board itself scrolls horizontally on small screens
- Remove `statusFilter` state (columns replace the filter bar)
- Keep search bar (filters across all columns simultaneously)

**Task 1.2** — Build the `QuoteCard` component (inline, not separate file)
- Props: `quote`, `onClick`
- Shows: event name (large italic), client name, date (DD/MM), urgency badge (🔥 if HIGH), price (R$), service icons (Camera/Video/Smartphone), technical status badge (small), protocol ID (last 6 chars, dimmed)
- Red left-border accent if urgency === "HIGH"
- Hover: subtle glow + scale effect (framer-motion whileHover)
- Active: ring highlight (same as current selected state)

---

## Wave 2 — Drawer Component

**Task 2.1** — Build the `QuoteDrawer` component (inline in AdminQuotes.tsx)
- Triggered by `selectedQuote !== null`
- Fixed overlay (z-40) + drawer panel (z-50, ~600px wide, right-side)
- Slide-in animation: `motion.div` from framer-motion (already imported)
  - `initial={{ x: "100%" }}` → `animate={{ x: 0 }}` → `exit={{ x: "100%" }}`
  - Use `AnimatePresence` wrapper for exit animation
- Backdrop click closes drawer (`setSelectedQuote(null)`)
- Drawer header: event name, protocol ID, X button
- Drawer body: the 5 existing tabs (Briefing, Equipe, Locação, Custos, Fechamento)
  - All tab content migrated unchanged from the current right panel
- Mobile: drawer is full-width (100vw)

**Task 2.2** — Migrate all 5 tab content sections into the drawer body
- Move lines 461–717 (tab content) into the `QuoteDrawer` render
- All state refs (`activeTab`, `selectedStaff`, `selectedEquip`, etc.) remain in parent
- Pass as props or keep in parent scope (inline component approach)

---

## Wave 3 — Polish & Cleanup

**Task 3.1** — Visual column headers
- Column name (operational label) in large font
- Count badge (number of cards in column) — `brand-tactical` colored
- Subtle top border accent in the column's color
- "Arquivados" column collapsed by default with a toggle chevron

**Task 3.2** — Empty state per column
- Each empty column shows a minimal placeholder (dashed border, icon, subtle text)
- Not the large illustrative empty state (that was for the full page)

**Task 3.3** — Remove dead code
- Remove `statusFilter` state and the filter button bar from the header
- Remove `filteredQuotes` useMemo (replace with per-column filtering)
- Keep `stats` useMemo (used in empty/overview state)
- Keep search state and input

---

## Files Modified

| File | Change |
|------|--------|
| `frontend/src/pages/admin/AdminQuotes.tsx` | Full refactor — Kanban layout, QuoteCard, QuoteDrawer |

## Files Unchanged

| File | Reason |
|------|--------|
| All backend routes | No changes needed |
| `merlin_pricing.ts` | Data constants — unchanged |
| `api.ts` | API calls unchanged |

---

## Constraints

- Zero new npm dependencies
- Framer motion already installed — use `AnimatePresence` + `motion.div`
- All design tokens from Midnight Luxury (`brand-tactical`, `theme-bg`, etc.)
- TypeScript strict — no new `any` types
