# Phase 53: Vault Configuration & Administration - Plan

## Target
Provide the vault owner with a dedicated settings modal to manage album metadata, media organization, and access control.

## Feature Breakdown

### 1. Database & Backend Enhancements
- **Schema Update**: Add EXIF/Metadata fields to `SharedAlbumMedia` in `prisma/schema.prisma`:
  - `fileSize Int?`
  - `width Int?`
  - `height Int?`
  - `originalDate DateTime?`
- **Controller Update (`vault.controller.ts`)**:
  - Update `uploadMedia` to parse and save `fileSize` (from `file.size`), and attempt to extract EXIF data (`width`, `height`, `originalDate`) during the Sharp processing step.
  - Create endpoint: `PATCH /api/vaults/:albumId` to allow renaming the album (`nome`).
  - Create endpoint: `DELETE /api/vaults/:albumId/members/:userId` to allow the owner to remove guests.

### 2. UI Components - Vault Settings Modal
- **Component (`VaultSettingsModal.tsx`)**:
  - Accessible via a Gear ⚙️ icon in the `VaultDetailPage` header (only visible to the OWNER).
  - Uses the Midnight Luxury design (dark backgrounds, emerald accents, glassy borders).
  
### 3. UI Features - Settings Tabs
- **Tab 1: Geral (General)**:
  - Input to rename the album. Calls the new `PATCH` endpoint.
- **Tab 2: Participantes (Access Control)**:
  - List all `members` fetched from the album details.
  - Provide a "Remover" button next to each member (except the OWNER). Calls the `DELETE` endpoint.
- **Tab 3: Organização (Sorting Strategy)**:
  - Radio buttons or Select dropdown to define the *local* sort order of the gallery.
  - Sorting options:
    - Nome do arquivo (if available, fallback to id)
    - Data de Upload (Mais recentes primeiro / Mais antigas)
    - Data de Criação (EXIF Original)
    - Tamanho do Arquivo (Maior / Menor)
    - Orientação (Agrupar horizontais e verticais)
  - This state (`sortConfig`) will be kept in the `VaultDetailPage` state and passed down to the `VaultGallery`.

## Task List

- [ ] **[BLOCKING]** Update `schema.prisma` with `fileSize`, `width`, `height`, `originalDate` on `SharedAlbumMedia`.
- [ ] **[BLOCKING]** Run `npx prisma db push --accept-data-loss` to sync the database schema.
- [ ] Update `vault.controller.ts` -> `uploadMedia` to extract and save the new metadata fields using Sharp metadata.
- [ ] Add `PATCH /api/vaults/:albumId` endpoint to rename the album.
- [ ] Add `DELETE /api/vaults/:albumId/members/:userId` endpoint to remove guests.
- [ ] Create `VaultSettingsModal.tsx` in `frontend/src/components`.
- [ ] Integrate `VaultSettingsModal` into `VaultDetailPage.tsx` (Gear icon for OWNERs).
- [ ] Implement client-side sorting logic in `VaultDetailPage.tsx` based on the selected criteria to reorder the `media` array before rendering.
