# Phase 53: Vault Configuration & Administration - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning
**Source:** PRD Express Path (.planning/PRD-53.md)

<domain>
## Phase Boundary

Provide the vault owner with a dedicated settings modal/page to manage album metadata (rename), media organization (sort by various metrics), and access control (view members, remove guests).
</domain>

<decisions>
## Implementation Decisions

### Renaming the Album

- The owner should be able to edit the name of the album after it has been created.
- This should update the `nome` field in the `SharedAlbum` model and reflect immediately on the frontend.

### Media Organization & Sorting

- The owner should be able to sort the photos in the album grid.
- Sorting options must include: Nome, Data/hora de upload, Data/hora de criação do arquivo, Tamanho do arquivo, Orientação (Horizontal / Vertical).
- Note: Since Google Drive proxy might not expose all EXIF data natively in the Prisma model right now, we may need to add fields to `SharedAlbumMedia` or just sort by existing data (createdAt).

### Access Control

- The owner must be able to view all participants (members) of the album.
- The owner must be able to manage them (e.g., remove guests).
- This uses the existing `AlbumMember` model.

### the agent's Discretion

- The UI could be a modal opened from a gear icon in `VaultDetailPage.tsx`.
- Schema additions to support EXIF metadata (width, height, size, original Date) if not present.
  </decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above
</canonical_refs>

<specifics>
## Specific Ideas

- The settings can be accessed via a "Settings" (gear) icon in the Vault Details header.
- The UI should be a clean modal or a slide-over panel following the Midnight Luxury theme.
  </specifics>

<deferred>
## Deferred Ideas

None — PRD covers phase scope
</deferred>

---

_Phase: 53-vault-configuration-administration_
_Context gathered: 2026-05-19 via PRD Express Path_
