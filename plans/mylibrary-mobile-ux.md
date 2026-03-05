# MyLibrary — Mobile UX Improvements Plan

Improve the smartphone experience by replacing table-based views with touch-friendly card/list layouts and collapsible filters across all pages.

---

## Current Mobile Pain Points

| Page | Problem |
|---|---|
| Library (`/`) | Table with many columns even after hiding some; expand-in-row is clunky on touch; admin action icons are tiny (`size="small"`); 4 filter dropdowns stack vertically and eat screen space |
| Wishlist (`/wishlist`) | All 5 columns visible on mobile; inline edit puts text fields inside tiny table cells |
| Activity Log (`/log`) | Table with no mobile adaptation at all |
| Dashboard (`/dashboard`) | Charts mostly fine, but horizontal bar chart labels overflow on narrow screens |

---

## Improvements by Priority

### 🔴 Priority 1 — Library Page Card View (Highest Impact)

**What**: On `xs`/`sm` breakpoints, render a `BookCardList` component instead of `BookTable`.

**Card design per book**:
- Cover thumbnail (`coverImageUrl`) on the left if available
- Title (bold, large) + Author
- Genre chips + reading status chip
- Loan badge (if loaned)
- Tap the card → expands inline or navigates to full detail
- Admin: swipe-to-reveal or a `⋮` menu button → edit / loan / delete

**Files to create/edit**:
- Create `src/components/books/BookCardList.tsx` — new card list component
- Edit `src/components/books/BookTable.tsx` — conditionally render `BookCardList` when `isMobile`
- (Optional) Create `src/pages/BookDetailPage.tsx` + route `/book/:id` as full-screen detail

---

### 🔴 Priority 2 — Collapsible Filter Bar

**What**: On mobile, replace the 4 always-visible filter dropdowns with a single **"סינון"** button that shows an active-filter badge count. Tapping opens a bottom sheet or a `Drawer` with the filters inside.

**Files to edit**:
- `src/components/books/BookTable.tsx` — wrap filters in a `Collapse` / `Drawer` on mobile
- Keep the search `TextField` always visible

---

### 🟡 Priority 3 — Wishlist Mobile View

**What**: On mobile, replace the table with a simple stacked card list. Each card shows book name, series + volume, author. Admin actions (edit/delete) as icon buttons on the card.  
Inline add becomes a floating `+` FAB → opens a bottom sheet form.

**Files to edit**:
- `src/pages/WishlistPage.tsx` — add `isMobile` branch with card layout

---

### 🟡 Priority 4 — Larger Admin Touch Targets

**What**: Change admin `IconButton size="small"` to `size="medium"` on mobile in `BookTable`, `WishlistPage`, and `ActivityLogPage`. Minimum tap target: 44×44px.

**Files to edit**:
- `src/components/books/BookTable.tsx`
- `src/pages/WishlistPage.tsx`
- `src/pages/ActivityLogPage.tsx`

---

### 🟢 Priority 5 — Dashboard Chart Mobile Fix

**What**: The horizontal bar chart for genres uses `margin={{ left: 80 }}` which causes overflow on very narrow screens. Switch to a vertical bar chart or reduce left margin dynamically based on screen width.

**Files to edit**:
- `src/pages/DashboardPage.tsx`

---

### 🟢 Priority 6 — Activity Log Mobile View

**What**: Add `isMobile` detection; on mobile show a simplified card per log entry (action chip + book title + date) instead of the full table.

**Files to edit**:
- `src/pages/ActivityLogPage.tsx`

---

## Implementation Order

1. `BookCardList` component + wire into `BookTable` (Priority 1)
2. Collapsible filter bar in `BookTable` (Priority 2)
3. Larger touch targets in all three files (Priority 4 — trivial)
4. Wishlist mobile card view (Priority 3)
5. Dashboard chart fix (Priority 5)
6. Activity log mobile view (Priority 6)

---

## Files Affected Summary

| File | Change |
|---|---|
| `src/components/books/BookTable.tsx` | Card view branch + collapsible filters |
| `src/components/books/BookCardList.tsx` | **New file** — mobile card list |
| `src/pages/WishlistPage.tsx` | Mobile card layout + FAB |
| `src/pages/ActivityLogPage.tsx` | Mobile card layout + larger targets |
| `src/pages/DashboardPage.tsx` | Chart margin fix |
