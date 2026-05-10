# Phase 19 Context: Quotes Kanban Redesign

**Phase:** 19 — Kanban Redesign da Gestão de Orçamentos
**Date:** 2026-05-10
**Status:** Context captured — ready for planning

---

## <domain>
Refactor the AdminQuotes page from a list + right-panel layout into a full-width Kanban board.
Each column represents a quote lifecycle stage. Clicking a card opens a right-side drawer with the existing 5-tab pricing studio (Briefing, Equipe, Locação, Custos, Fechamento).
All existing backend API calls, state logic, and pricing calculations are preserved — this is a UI/UX restructure only.
</domain>

---

## <decisions>

### A — Kanban Columns (Hybrid naming)
- Columns use operational/human-readable names
- Each card carries a small badge with the technical status code
- Column → Status mapping:

| Column Label     | `quoteStatus` value | Badge color  |
|-----------------|---------------------|--------------|
| Novos Leads      | `PENDING`           | amber        |
| Em Precificação  | `PRICED`            | blue         |
| Proposta Enviada | `APROVADO`          | emerald      |
| Convertidos      | `CONVERTED`         | emerald/teal |
| Arquivados       | `REJECTED`          | red          |

- Archived column (`REJECTED`) can be collapsed by default to reduce visual clutter.

### B — Card Detail: Right Drawer
- Clicking a card opens a **right-side drawer** (slides in from the right)
- Kanban board remains visible/dimmed in the background
- Drawer contains all 5 existing tabs: `1. Briefing` · `2. Equipe` · `3. Locação` · `4. Custos` · `5. Fechamento`
- All existing tab logic, form state, and handlers are migrated unchanged into the drawer
- Drawer closes on: backdrop click, X button, or after a successful "Disparar Orçamento" action
- Drawer width: ~600px on desktop, full-width on mobile

### C — No Drag-and-Drop
- Status changes happen **only via actions inside the drawer** (existing buttons: "Disparar Orçamento Oficial" → APROVADO, "Arquivar" → REJECTED)
- No `@dnd-kit` or similar library needed — keep zero new dependencies
- Cards reorder within columns by `createdAt` desc (newest first)

### D — Card Density: Medium
Each card shows:
- **Event name** (`nomeNoivos`) — large italic heading
- **Client name** (`clientName`)
- **Event date** (`dataEvento`) formatted as `DD/MM/YYYY`
- **Urgency badge** — `🔥 URGENTE` in red if `urgency === "HIGH"`, subtle indicator otherwise
- **Base value** (`priceBase`) formatted as `R$ X.XXX`
- **Service icons** — small icon row: Camera (temFoto), Video (temVideo), Smartphone (temReels)
- **Technical status badge** (small, secondary) — e.g. `PENDING`
- **Protocol ID** — last 6 chars, dimmed (`#XXXXXX`)

No countdown timer on the card (keep it simple).

---

## <layout>

```
┌─────────────────────────────────────────────────────────────────────────┐
│  GESTÃO DE ORÇAMENTOS                [Busca]         [+ NOVO ORÇAMENTO] │
├──────────┬────────────────┬──────────────────┬────────────┬─────────────┤
│  NOVOS   │ EM PRECIFIC.   │ PROPOSTA ENVIADA │ CONVERTIDOS│  ARQUIVADOS │
│  LEADS   │                │                  │            │  (collapsed)│
│  (N)     │  (N)           │  (N)             │  (N)       │             │
├──────────┼────────────────┼──────────────────┼────────────┼─────────────┤
│ [Card]   │ [Card]         │ [Card]           │ [Card]     │             │
│ [Card]   │ [Card]         │                  │            │             │
│ [Card]   │                │                  │            │             │
└──────────┴────────────────┴──────────────────┴────────────┴─────────────┘
```

- Each column has a fixed-width (~260px min, flex-grow) with a header showing the count
- Columns scroll independently (vertical overflow per column)
- The board itself scrolls horizontally on smaller screens
- Search bar filters cards across ALL columns simultaneously
- "Novo Orçamento" button opens the existing creation modal (unchanged)

---

## <canonical_refs>

- `frontend/src/pages/admin/AdminQuotes.tsx` — current implementation (852 lines) — all logic to migrate
- `frontend/src/data/merlin_pricing.ts` — MERLIN_EQUIPMENT and STAFF_ROLES constants (used in pricing tabs)
- `frontend/src/lib/api.ts` — API client
- `frontend/src/lib/theme.ts` — design tokens

---

## <code_context>

### Reusable from current AdminQuotes.tsx
- All state variables and handlers are preserved as-is:
  - `quotes`, `selectedQuote`, `search`, `statusFilter`
  - `activeTab`, `selectedStaff`, `selectedEquip`, `transportCost`, `lodgingCost`, `margin`, `finalPrice`
  - `handleApprove()`, `handleReject()`, `handleCreateNewQuote()`
  - `addStaffPreset()`, `removeStaffInstance()`, `updateStaffUser()`, `addEquip()`
  - `parseBreakdown()`, `getStatusConfig()`, `stats` useMemo
- The 5-tab detail panel (lines 434–717) moves into the drawer component
- The "New Quote" modal (lines 762–852) stays unchanged

### Pattern: Drawer
- Use `motion.div` from `framer-motion` (already imported) for the slide-in animation
- Pattern: fixed overlay + `translate-x-full` → `translate-x-0` transition
- Z-index: drawer at z-50, backdrop at z-40

### Column grouping
```ts
const KANBAN_COLUMNS = [
  { id: 'PENDING',   label: 'Novos Leads',       color: 'amber'   },
  { id: 'PRICED',    label: 'Em Precificação',    color: 'blue'    },
  { id: 'APROVADO',  label: 'Proposta Enviada',   color: 'emerald' },
  { id: 'CONVERTED', label: 'Convertidos',        color: 'teal'    },
  { id: 'REJECTED',  label: 'Arquivados',         color: 'red'     },
] as const;
```

---

## <constraints>
- Zero new npm dependencies (no DnD library, no Kanban library)
- All existing API endpoints remain unchanged (`/admin/quotes`, `/admin/quotes/:id/approve`, `/admin/quotes/:id/reject`)
- Mobile: board scrolls horizontally; drawer is full-width
- Design system: Midnight Luxury tokens (`brand-tactical`, `theme-bg`, `theme-border`, etc.) — no hardcoded hex values
- The `statusFilter` state is retired — columns replace the filter bar (search bar kept)
</constraints>
