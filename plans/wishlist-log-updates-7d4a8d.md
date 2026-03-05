# Wishlist Sorting + Log Editing

Update WishlistPage with sortable columns and ActivityLogPage with editable entries and date-only display.

---

## 1. Wishlist — Sortable Table

**File:** `src/pages/WishlistPage.tsx`

- Add `orderBy` / `order` state (column key + asc/desc)
- Default sort: `seriesName` asc, then `bookVolume` asc (secondary, client-side)
- Clickable `TableSortLabel` on all column headers
- Sorting is purely client-side (data already loaded in state)
- Volume compared numerically when both values are numeric strings, lexicographically otherwise
- Items without a series sort after items with a series

## 2. Activity Log — Editable Entries + Date-Only Display

**File:** `src/pages/ActivityLogPage.tsx`

- Column header renamed: "תאריך ושעה" → "תאריך"
- Date display: `toLocaleDateString('he-IL')` instead of `toLocaleString` (date only, time stored but not shown)
- Add inline edit per row (admin-only): edit icon opens inline text fields for:
  - `bookTitle` — free text
  - `loanerName` — free text (only shown for loan/return actions)
  - `actionType` — dropdown (select from activity type labels)
  - `actionDate` — date picker input
- Save/cancel icon buttons (same pattern as WishlistPage)
- `activityLogService` gets an `updateEntry(id, data)` method — no logging call (edit is silent)

**File:** `src/services/activityLogService.ts`

- Add `updateEntry(id, Partial<ActivityLogEntry>)` — calls `updateDoc`

---

## Notes
- Edit icon in log only visible to admin (same as wishlist pattern)
- Sorting in wishlist: add row stays pinned at top, sort applies only to data rows
