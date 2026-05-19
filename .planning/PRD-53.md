# PRD: Vault Configuration & Administration

## Goal
The creator of the album (Vault Owner) must have a dedicated configuration panel/modal in the `VaultDetailPage.tsx` or a separate route to manage their album.

## Features

1. **Renaming the Album (nome do album):**
   - The owner should be able to edit the name of the album after it has been created.
   - This should update the `nome` field in the `SharedAlbum` model and reflect immediately on the frontend.

2. **Media Organization & Sorting (organizar):**
   - The owner should be able to sort the photos in the album grid.
   - Sorting options must include:
     - Nome (Name)
     - Data/hora de upload (Upload timestamp)
     - Data/hora de criação do arquivo (File creation timestamp - from Exif if available, or fallback to upload)
     - Tamanho do arquivo (File size)
     - Orientação (Horizontal / Vertical)
   - Note: Since Google Drive proxy might not expose all EXIF data natively in the Prisma model right now, we may need to add fields to `SharedAlbumMedia` or just sort by existing data (createdAt).

3. **Access Control (controle de acesso):**
   - The owner must be able to view all participants (members) of the album.
   - The owner must be able to manage them (e.g., remove guests).
   - This uses the existing `AlbumMember` model.

## UI/UX
- Use the existing Midnight Luxury UI/UX.
- The settings can be accessed via a "Settings" (gear) icon in the Vault Details header.
- The UI should be a clean modal or a slide-over panel.
