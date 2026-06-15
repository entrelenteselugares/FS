# Phase 72: Camera Stories & Background Upload - Research

## Objective

Plan the implementation of "Camera Stories & Background Upload" for the Phygital Capture experience. The goal is to allow users to take multiple photos sequentially without being blocked by loading screens, and ensure those photos are reliably uploaded in the background, surviving page navigations and reloads.

## Current State Analysis

File: `frontend/src/pages/PhygitalCapture.tsx`

- **Native Camera Input:** Uses `<input type="file" capture="environment" />` to launch the native camera.
- **Upload Queue:** Currently uses `useState<UploadItem[]>([]);` which is volatile (lost on reload).
- **Blocking UX:** `isUploadingGlobal` sets a fullscreen blocking overlay `fixed inset-0 z-50` that prevents the user from capturing another photo while the current one is uploading.
- **File Upload:** Iterates through `UploadItem` sequentially and uploads via `API.post('/public/phygital/upload', formDataPayload)`.

## Technical Approach

### 1. Non-Blocking "Stories" Capture

- Remove the `isUploadingGlobal` fullscreen overlay when capturing photos.
- Allow the user to immediately tap the camera button again while the previous photo uploads in the background feed.
- The UI already has a grid at the bottom showing upload status. This is perfect for the "Stories" feel: capture, see it drop into the grid as "uploading", capture again immediately.
- We will keep the blocking overlay for **videos** if necessary (due to processing), or remove it entirely if video upload can also be safely backgrounded.

### 2. Background Upload Persistence (IndexedDB)

- **Problem:** `useState` loses the queue if the user refreshes or closes the browser while an upload is pending.
- **Solution:** Use **IndexedDB** to store `File` objects and metadata.
- Native `IndexedDB` supports storing `Blob` and `File` objects directly on Android and iOS (Safari 10+).
- We should create a utility, e.g., `frontend/src/lib/uploadQueueDB.ts`, wrapping standard IndexedDB operations (open, add, get, delete, list) to persist the queue.
- No external libraries (like `idb` or `localforage`) are currently installed, so we can either use native IndexedDB wrapped in Promises or add `idb` to `package.json`. Native IndexedDB is lightweight enough for a simple `requests` store.

### 3. Global Upload Manager

- To ensure uploads continue even if the user navigates away from `PhygitalCapture.tsx` to another page in the app, we should elevate the queue processing.
- However, if the requirement is only to survive within `PhygitalCapture.tsx` and across reloads, a local `useEffect` syncing with IndexedDB might be enough. Given "Background Upload", a global context `UploadQueueContext` wrapping the app (or inside `EventPage`) would be ideal, so users can browse the gallery while their 20 photos upload.

## Actionable Plan Requirements

1. Create `uploadQueueDB.ts` to manage IndexedDB persistence for `UploadItem`.
2. Refactor `PhygitalCapture.tsx` to sync its queue with IndexedDB on mount and on every new file.
3. Remove the `isUploadingGlobal` overlay for photos to enable continuous "Stories" capturing.
4. Implement a robust retry mechanism for failed uploads loaded from IndexedDB.

## Open Questions for Planning

- Should the upload queue be elevated to a global React Context (`UploadContext.tsx`) so it continues uploading while the user navigates the app, or is it sufficient to process the queue only when the user is on the `PhygitalCapture` page?
- Do we need to install `idb` via npm, or implement the IndexedDB wrapper natively?
