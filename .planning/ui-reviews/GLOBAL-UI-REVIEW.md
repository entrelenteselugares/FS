# GLOBAL UI REVIEW: Platform-Wide Standardization

**Date**: 2026-05-10
**Pillars Assessment**:

- **Copywriting**: 4/4 (Professional tone maintained)
- **Visuals**: 3/4 (Luxury aesthetic present but execution varies)
- **Color**: 4/4 (Themed correctly)
- **Typography**: 2/4 (Significant inconsistencies in sizes and tracking)
- **Spacing**: 2/4 (Variable paddings and gaps across dashboards)
- **Experience Design**: 3/4 (Functional but visually jarring in transitions)

---

## 1. Findings per Profile

### ADMIN (Central Operations)

- **Typography**: Page titles vary between `text-4xl` and `text-6xl`. Subtitles are inconsistently `text-[10px]` vs `text-[11px]`.
- **Containers**: KPI cards in `AdminOverview` have `p-8`, while table rows in `AdminEvents` use ad-hoc padding.
- **Buttons**: Variable text sizes in action buttons (`text-[8px]` vs `text-[9px]`).

### CLIENTE (Consumer Area)

- **Typography**: Recently standardized to `text-6xl` for titles and `text-[11px]` for subtitles, but body text and cards still use variable sizes.
- **Proportions**: Grid gaps in `ClienteArea` vary from `gap-4` to `gap-12`.

### PROFISSIONAL (Cockpit)

- **Typography**: `DashboardHeader` was updated, but internal tabs (Finance, Network) use `text-[10px]` labels while main KPI stats use `text-7xl`.
- **Alignment**: Some sections use `items-end` while others use `items-center` for similar header layouts.

### UNIDADE FIXA (Ponto Fixo)

- **Typography**: High variability in metadata sizes (`text-[8px]` up to `text-[12px]`).
- **Spacing**: Tracking varies between `tracking-widest` and `tracking-[0.4em]`.
- **Proportions**: Card paddings switch between `p-4` and `p-6` without clear hierarchy.

### FRANQUEADO (Franchisee)

- **Consistency**: Shares many components with Profissional/Unidade but often deviates in local overrides.

---

## 2. Action Plan: Global Unification

### A. Typography Scale (Standard)

1. **Main Title (H1)**: `text-4xl md:text-6xl` font-heading font-black uppercase tracking-tighter italic.
2. **Subtitle**: `text-[11px]` text-theme-muted/brand uppercase tracking-[0.4em] font-black italic.
3. **Card/Section Header**: `text-[10px]` font-black uppercase tracking-[0.3em] italic.
4. **Metadata Labels**: `text-[9px]` font-black uppercase tracking-widest text-theme-muted.
5. **Stat Values**: `text-2xl md:text-4xl` (Large Stats) or `text-5xl md:text-7xl` (Hero Stats).

### B. Spacing & Containers

1. **Standard Page Padding**: `px-4 md:px-6 py-6 md:py-10`.
2. **Standard Section Gap**: `space-y-8 md:space-y-12`.
3. **Standard Card Padding**: `p-6` (Standard) or `p-8` (KPI/Hero).
4. **Standard Grid Gap**: `gap-6` (Standard) or `gap-px` (Border-separated stats).

### C. Buttons & Interactions

1. **Primary**: Use `BtnPrimary` token (14px font, 13px padding).
2. **Secondary/Action**: `text-[9px]` font-black uppercase tracking-widest.

---

## 3. Progress Tracking

1. [x] Fix `AdminOverview.tsx` and `AdminDashboard.tsx`. (DONE)
2. [x] Fix `ClienteArea.tsx` and related sub-components. (DONE)
3. [x] Fix `ProfissionalDashboard.tsx` and `DashboardHeader.tsx`. (DONE)
4. [x] Fix `UnidadeFixaDashboard.tsx`. (DONE)
5. [x] Fix `FranchiseDashboard.tsx`. (DONE)

---

## 4. Final Verdict

The platform now adheres to a unified visual hierarchy. Transitions between administrative and consumer views are visually seamless, maintaining the "Midnight Luxury" aesthetic through strict typography and spacing tokens.
