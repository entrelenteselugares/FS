# PLAN: Phase 34 — Multi-Vertical Agility

## 1. Admin Dashboard Extensibility

- [ ] **Event Creation Form**: Modify `AdminEventForm.tsx` to include an `EventType` dropdown (Wedding, School, Sports, Flash).
- [ ] **Dynamic Fields**:
  - If `SCHOOL` is selected: Show a textarea or CSV upload for "Student List" and save to `verticalConfigs.studentList`.
  - If `SPORTS` is selected: Show configuration for "Enable Bib Number Search".

## 2. Sports Vertical (The Runner Experience)

- [ ] **Gallery Search UI**: Add a prominent search bar at the top of `EventPage.tsx` when `event.type === 'SPORTS'`.
- [ ] **Filter Logic**: Implement frontend filtering of `medias` based on `aiTags` or `metadata.bib` matching the search query.

## 3. School Vertical (The Parent Experience)

- [ ] **Authentication Gate**: Create `SchoolAuthenticationGate.tsx` displayed before the gallery loads when `event.type === 'SCHOOL'`.
- [ ] **Student Selector**: The gate should parse `event.verticalConfigs.studentList` and present a dropdown.
- [ ] **Restricted View**: Once a student is selected, filter the `medias` array to only show photos where `metadata.studentId` matches.

## 4. Photographer Upload UX (Backoffice)

- [ ] **Manual Tagging**: Update `BulkUpload.tsx` to allow photographers to bulk-assign tags (Bib numbers or Student IDs) to selected photos before finalizing the upload.

---

## 🏁 Verification (UAT)

1. **Admin**: Can create a SPORTS event and a SCHOOL event with distinct configurations.
2. **Sports**: User can visit the sports gallery, type "104" in the search bar, and only see photos tagged with 104.
3. **School**: Parent is forced to pick a student name from a dropdown before seeing any photos, and the resulting grid only shows that student.
4. **Pro**: Photographer can select 5 photos in the dashboard and assign "Bib 104" to all of them at once.
