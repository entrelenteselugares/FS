---
phase: 18
slug: modal-standardization
status: approved
shadcn_initialized: false
preset: luxury-tactical
created: 2026-05-10
---

# Phase 18 — UI Design Contract: Premium Modal Standardization

> Visual and interaction contract for the Professional Dashboard modals. This phase aligns operational modals (Express Sale, Foto Point, Flash Event) with the premium "Minha Seleção" (Cart) standard.

---

## Design System

| Property          | Value                                    |
| ----------------- | ---------------------------------------- |
| Tool              | Tailwind CSS + Vanilla CSS               |
| Preset            | Midnight Luxury v3.1                     |
| Component library | none (custom components)                 |
| Icon library      | Lucide React                             |
| Font              | Barlow Condensed (Display), Inter (Body) |

---

## Spacing Scale

Declared values (multiples of 4 where possible, aligning with `.lux-window` patterns):

| Token | Value | Usage                     |
| ----- | ----- | ------------------------- |
| xs    | 4px   | Icon gaps, inline padding |
| sm    | 8px   | Compact element spacing   |
| md    | 16px  | Default element spacing   |
| lg    | 24px  | Section padding (mobile)  |
| xl    | 32px  | Modal gaps                |
| 2xl   | 40px  | Window padding (`2.5rem`) |
| 3xl   | 64px  | Page-level spacing        |

Exceptions: Modal border-radius is fixed at `40px` for desktop, `20px` for mobile.

---

## Typography

| Role     | Size | Weight | Line Height | Font Family                          |
| -------- | ---- | ------ | ----------- | ------------------------------------ |
| Body     | 14px | 400    | 1.5         | Inter                                |
| Label    | 10px | 900    | 1.0         | Inter (Uppercase, 0.2em tracking)    |
| Heading  | 24px | 900    | 1.1         | Barlow Condensed (Italic, Uppercase) |
| Subtitle | 9px  | 900    | 1.0         | Inter (Uppercase, 0.4em tracking)    |

---

## Color

| Role            | Value   | Usage                                   |
| --------------- | ------- | --------------------------------------- |
| Dominant (60%)  | #0a0a0a | Backdrop, Overlay                       |
| Secondary (30%) | #111111 | Modal Body (var(--bg-card))             |
| Accent (10%)    | #85B9AC | Brand tactical (Buttons, active states) |
| Destructive     | #ef4444 | Error states, Delete actions            |

Accent reserved for: Primary action buttons, active tab indicators, and focus borders.

---

## Copywriting Contract

| Element               | Copy                                                   |
| --------------------- | ------------------------------------------------------ |
| Express Sale Title    | IDENTIFICAÇÃO / CONFIGURAÇÃO / LOGÍSTICA / FINALIZAÇÃO |
| Express Sale Subtitle | UNIDADE DE VENDA DIRETA                                |
| Foto Point Title      | CONFIGURAR PONTO DE VENDA                              |
| Foto Point Subtitle   | NOVA CATEGORIA: FOTO POINT                             |
| Flash Event Title     | FOTO PRINT LIVE                                        |
| Flash Event Subtitle  | ACESSO INSTANTÂNEO                                     |
| Primary CTA           | Specific verb + noun (e.g., "ATIVAR FOTO POINT AGORA") |

---

## Registry Safety

| Registry   | Blocks Used                        | Safety Gate          |
| ---------- | ---------------------------------- | -------------------- |
| lux-window | Container, Header, Content, Footer | Defined in index.css |
| lux-button | Tactical, Ghost                    | Defined in index.css |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** 2026-05-10
