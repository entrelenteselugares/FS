# Phase 05 — UI Review

**Audited:** 2026-05-03
**Baseline:** Abstract 6-pillar standards (Marketplace Hardening)
**Screenshots:** Not captured (System failure during browser subagent spawn)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Strong conversion tone ("CHECKOUT BLINDADO") but labels could be more empathetic. |
| 2. Visuals | 3/4 | Clear focal points; fixed password icon overlap and QR size issues during audit. |
| 3. Color | 2/4 | Excessive hardcoded hex values (#0A0A0A) in checkout blocks; inconsistent theme adaptation. |
| 4. Typography | 3/4 | Good use of weights for hierarchy; some labels are dangerously small (8-9px). |
| 5. Spacing | 3/4 | Clean grids in Print Store; some arbitrary padding values used. |
| 6. Experience Design | 2/4 | Great cross-sell (album integration); fragile dependency loading (FixedSizeList) and no easy polling exit. |

**Overall: 16/24**

---

## Top 3 Priority Fixes

1. **Theme Variable Enforcement** — Remove hardcoded `#0A0A0A` and `bg-black` from `CheckoutPage.tsx` and replace with `var(--bg-card)` or `bg-theme-bg-muted`. This ensures accessibility for Light Mode users.
2. **Typography Accessibility Audit** — Increase minimum font size for informative labels from `9px` to at least `11px`. Current sizes are below the comfort threshold for mobile users.
3. **Dependency Resilience** — Move `react-window` imports to a central `lib/components` wrapper that handles the hybrid ESM/CJS export issue once, preventing "white screen" regressions in other modules.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

- **Positive:** Use of "Eternizar no Papel" is emotionally resonant and differentiates from "Download Digital".
- **Improvement:** In `AccessTypeModal.tsx`, "Galeria oculta" should be "Privacidade Protegida" to sound like a feature, not a restriction.

### Pillar 2: Visuals (3/4)

- **Resolved:** Fixed the `Lock` icon overlapping text in the password input.
- **Resolved:** Fixed the Pix QR Code rendering as a tiny 40px box by using Google Charts API with explicit dimensions.

### Pillar 3: Color (2/4)

- **Defect:** `CheckoutPage.tsx:412` uses `bg-[#0A0A0A]` which remains pitch black even if the user switches to Light Mode.
- **Defect:** `CheckoutPage.tsx:436` uses `bg-black` for the Copy/Paste block.
- **Evidence:** Multiple `grep` hits for hardcoded hex codes in `src/pages`.

### Pillar 4: Typography (3/4)

- **Good:** Consistent `font-black` for major headings.
- **Issue:** `text-[8px]` used in `CheckoutPage.tsx:437` is nearly illegible on non-retina screens.

### Pillar 5: Spacing (3/4)

- **Good:** Use of `space-y-8` creates a logical progression in the payment flow.
- **Inconsistency:** `PrintStoreModal.tsx` uses `p-4`, `p-5`, and `p-8` in different blocks without a clear spacing scale.

### Pillar 6: Experience Design (2/4)

- **Success:** The integration of `unlockedMediaIds` into the Print Store is a major UX win for digital customers.
- **Risk:** The "Uncaught SyntaxError" for `FixedSizeList` indicates a lack of defensive coding around third-party module exports in the build pipeline.

---

## Files Audited

- `frontend/src/pages/EventPage.tsx`
- `frontend/src/pages/CheckoutPage.tsx`
- `frontend/src/components/PrintStoreModal.tsx`
- `frontend/src/components/AccessTypeModal.tsx`
- `frontend/src/index.css`
