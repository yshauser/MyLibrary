# Add Manual Log Entry

Add an "Add Row" button to the activity log page (admin-only) that lets admins insert a manual entry directly into the log table.

---

## Approach — inline add row (same pattern as WishlistPage)

### `src/pages/ActivityLogPage.tsx`
- Add an **"הוסף רשומה"** button (admin-only) above the table
- Clicking it reveals a pinned row at the top of the table with inline fields:
  - `תאריך` — date input (default: today)
  - `פעולה` — action type select (default: first item)
  - `שם הספר` — text field (required)
  - `שם השואל` — text field (optional)
  - `בוצע על ידי` — text field (default: logged-in user email, editable)
- Save / cancel icons in the actions column
- On save: calls `activityLogService.addManualEntry()` → reloads table

### `src/services/activityLogService.ts`
- Add `addManualEntry(data)` method — calls `addDoc` with a `Timestamp` derived from the date field (no auto-logging of this action)

---

## Notes
- `bookId` is required by the type but meaningless for manual entries; will use `'manual'` as the value
- Add row is visible only to admins
- If `bookTitle` is empty, Save is disabled
