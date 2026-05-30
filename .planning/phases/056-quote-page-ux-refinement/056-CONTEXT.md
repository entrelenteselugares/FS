# Phase 56 Context: QuotePage UX Refinement

**Date:** 2026-05-29  
**Status:** Ready for Planning

---

<domain>

This phase refines two UX friction points in the client-facing quote/booking flow (`/cotacao` → `QuotePage.tsx`):

1. **Dynamic Event Types per Unidade Fixa** — the "Tipo de Evento" dropdown currently shows a global hardcoded list. When a client selects a Unidade Fixa, the list should only show event types that unit actually supports.

2. **Single-Select Equipment & Usage Type** — the "Equipamento Preferencial" (Mobile Maker / Tradicional) and "Tipo de Finalidade" (Pessoal / Business) toggles currently allow multi-select. They must be converted to radio-style single-selection.

</domain>

---

<decisions>

### 1. Event Type Filtering for Unidade Fixa

- **Who defines event types:** Each Unidade Fixa configures its own allowed event types in its admin/settings profile (`AdminSettings.tsx` + Cartorio backend settings). No global mapping.
- **Storage:** A new field `eventTypes String[]` added to the `Cartorio` model in Prisma (migration required). Defaults to the full list if empty, ensuring backward compatibility.
- **UI in Quote flow:** When `locationType === "PARTNER"` and a partner is selected, the "Tipo de Evento" `<select>` is filtered to show only `currentPartner.eventTypes`. If the partner has no `eventTypes` defined yet (empty array), fall back to showing the full global list.
- **Full master list of event type options** (for both admin configuration UI and the fallback):
  - `CASAMENTO`
  - `ANIVERSARIO`
  - `SHOW_FESTIVAL`
  - `CORPORATIVO` (Evento Corporativo)
  - `FORMATURA`
  - `ENSAIO` (Ensaio Fotográfico)
  - `BAILE_FESTA` (Baile / Festa)
  - `CONFRATERNIZACAO`
  - `CHURRASCO_BUFFET` (Churrasco / Buffet)
  - `OUTROS`

### 2. Single-Select for Equipment & Usage Type

- **Current behavior:** `toggleWorkflow()` allows multiple values via array; `usageType` is already single-select but visually inconsistent.
- **Decision:** Both fields become **radio-style single-select** — clicking an already-selected option has no effect (keeps it selected, can't deselect); clicking a different option immediately switches.
- **State change:** `workflowPref` state changes from `string[]` to `string` (single value, default `"TRADICIONAL"`). Remove `toggleWorkflow` function; replace with direct `setWorkflowPref(value)`.
- **`usageType` state:** already `string`, no type change needed — only visual consistency fix to match the new radio style.

### 3. Equipment & Usage Type visibility with Unidade Fixa selected

- **Decision:** Both fields appear normally even when Unidade Fixa is selected — the client still chooses their equipment preference and usage context. Fields are NOT hidden.

</decisions>

---

<code_context>

### Files to modify

| File | Change |
|------|--------|
| `frontend/src/pages/QuotePage.tsx` | Filter category dropdown; radio-style for workflowPref & usageType; state type change |
| `backend/prisma/schema.prisma` | Add `eventTypes String[] @default([])` to `Cartorio` model |
| `backend/src/controllers/admin.controller.ts` | Expose `eventTypes` in admin cartorio PATCH endpoint |
| `frontend/src/pages/admin/AdminSettings.tsx` | Add multi-checkbox UI for Unidade Fixa to configure `eventTypes` |

### Relevant existing patterns

- **Partner data fetched at load:** `API.get("/public/unidades-fixas")` → `setPartners()`. The `eventTypes` field just needs to be included in this endpoint's response.
- **`currentPartner` memo:** `useMemo(() => partners.find(p => p.id === selectedPartnerId), ...)` — already used for `disabledServices`, `workingHours`, `fixedDuration`. `eventTypes` follows the same pattern.
- **`Cartorio` schema already has** `services String[] @default([])` and `disabledServices String[] @default([])` as precedent for array fields.
- **`workflowPref` state** is at line 342 of `QuotePage.tsx`, initialized as `string[]`. Sent to API as `workflowPref.join(" + ")` at line 520.

### No new API endpoints needed

The existing `/public/unidades-fixas` endpoint just needs to include `eventTypes` in its SELECT. The admin settings already have a PATCH endpoint for cartorio config. No new routes.

</code_context>

---

<canonical_refs>

- `frontend/src/pages/QuotePage.tsx` — main file for both changes
- `frontend/src/pages/admin/AdminSettings.tsx` — admin config UI for eventTypes
- `backend/prisma/schema.prisma` — `Cartorio` model (line 288)
- `backend/src/controllers/admin.controller.ts` — cartorio update logic

</canonical_refs>

---

<deferred>

- **Mapping equipment to unit type:** Future idea to auto-suggest equipment preference based on the type of venue (studio → Tradicional, street → Mobile). Deferred — not in scope.

</deferred>
