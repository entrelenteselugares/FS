# Phase 34 Context: Multi-Vertical Agility (School & Sports)

## 🎯 Decisions
1. **Vertical Identification**: The platform relies on the existing `EventType` enum (`SCHOOL`, `SPORTS`, `ALBUM_FULL`, etc.).
2. **Sports Vertical**: 
   - Focus: Fast delivery and volume sales.
   - Mechanism: Photographers tag photos with "Bib Numbers" (Número de Peito).
   - Delivery: The frontend gallery will expose a powerful search bar to filter `EventMedia` by `metadata.bib` or `aiTags`.
3. **School Vertical**:
   - Focus: Privacy and structured lists.
   - Mechanism: Events store a `studentList` inside `Event.verticalConfigs`. Photos are linked via `metadata.studentId`.
   - Delivery: The gallery will require parents to select their child's name from a secure dropdown before viewing the restricted photo subset.
4. **Admin UX**: The Event creation flow in the dashboard must expose a "Vertical" selector and dynamic fields (e.g., upload student list CSV for schools).

## 🏗️ Technical Approach
- **Backend**: Extend the `/api/public/events/:slug` endpoint to handle filtered queries based on vertical rules (e.g., `?bib=123` or `?studentId=456`).
- **Frontend**: 
  - Create dynamic wrappers for `EventPage.tsx` based on `event.type`.
  - Build `SportsSearchHeader.tsx` (bib number input).
  - Build `SchoolAuthenticationGate.tsx` (student selection + PIN).

---
*Created: 2026-05-14 | Phase 34*
