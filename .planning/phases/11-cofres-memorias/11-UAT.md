# UAT Finding: Phygital-Vault Hybrid Sync

## [F-01] Missing thumbnailLink and incomplete SharedAlbumMedia registration in PhygitalService
**Severity:** High
**Description:** When a photo is uploaded via Phygital to a Vault (SharedAlbum), the record in 'SharedAlbumMedia' is created without the 'thumbnailLink'. This causes the frontend to rely exclusively on the proxy, which might fail or be slower. Additionally, the service should ensure full compatibility with the 'Meus Álbuns' format.
**File:** backend/src/services/phygital.service.ts
**Status:** OPEN
