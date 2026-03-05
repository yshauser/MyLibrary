# Header Fix + Activity Log + Wishlist

Add responsive mobile header with hamburger drawer, an automatic activity log, and a wishlist page for missing books.

---

## 1. Header — Responsive Mobile Layout
**File:** `src/components/layout/Header.tsx`

- **Desktop (≥600px):** Single toolbar — title, 4 horizontal tabs (ספרייה, סטטיסטיקה, יומן פעילות, רשימת משאלות), admin icon buttons (add, export, import, logout)
- **Mobile (<600px):** Title + hamburger icon → opens MUI `Drawer` containing:
  - Navigation links (ספרייה, סטטיסטיקה, יומן פעילות, רשימת משאלות)
  - Admin actions (הוספה, ייצוא, ייבוא, התנתקות) — shown only for admins
- Removes `Button` import (logout becomes icon-only on desktop too)

## 2. Activity Log

### 2a. Types & Service
- **New file:** `src/types/activityLog.ts`
  - `ActivityType = 'add' | 'edit' | 'delete' | 'loan' | 'return'`
  - `ActivityLogEntry` — `id`, `actionType`, `actionDate` (Timestamp), `bookTitle`, `bookId`, `loanerName?`, `performedBy` (email)
- **New file:** `src/services/activityLogService.ts`
  - `logAction(entry)` — write to Firestore `activityLog` collection
  - `getActivityLog()` — fetch all, ordered by `actionDate` desc

### 2b. Hook into existing services
- **`src/services/bookService.ts`** — after `addBook`, `updateBook`, `deleteBook` succeed, call `logAction` with the appropriate type + book title
- **`src/services/loanService.ts`** — after `loanBook` and `returnBook` succeed, call `logAction` with loaner name
- Logging is fire-and-forget (errors don't block the main action)

### 2c. Log Page
- **New file:** `src/pages/ActivityLogPage.tsx`
  - Read-only table: date/time, action type (Hebrew label), book name, loaner (if applicable)
  - Sorted newest-first
  - Admin-only page (wrapped in `AdminRoute`)

## 3. Wishlist

### 3a. Types & Service
- **New file:** `src/types/wishlist.ts`
  - `WishlistItem` — `id`, `bookName` (required), `seriesName?`, `bookVolume?`, `author?`, `publishingHouse?`, `dateAdded` (Timestamp)
- **New file:** `src/services/wishlistService.ts`
  - CRUD: `getAll`, `add`, `update`, `delete`

### 3b. Wishlist Page
- **New file:** `src/pages/WishlistPage.tsx`
  - Simple table with all fields
  - Inline add row at top (text fields + add button)
  - Edit/delete icon buttons per row (admin-only)
  - Visible to all users; editable by admins only

## 4. Routing & Navigation
- **`src/App.tsx`** — Add routes:
  - `/log` → `ActivityLogPage` (admin-only)
  - `/wishlist` → `WishlistPage` (public)

## 5. Firestore Rules
- **`firestore.rules`** — Add rules for `activityLog` (admin write, admin read) and `wishlist` (public read, admin write)

## 6. Deploy
- Commit, push → GitHub Actions auto-deploys

---

## 7. Wishlist Sorting + Log Editing (follow-up)

### 7a. Wishlist — Sortable Table (`src/pages/WishlistPage.tsx`)
- Add `orderBy` / `order` state; default: `seriesName` asc → `bookVolume` asc (secondary)
- Clickable `TableSortLabel` on all column headers; sorting is client-side only
- Volume compared numerically when both values parse as numbers
- Items without a series sort after items with one
- Add row stays pinned at top regardless of sort

### 7b. Activity Log — Editable Entries (`src/pages/ActivityLogPage.tsx`)
- Date column shows date only (`toLocaleDateString`), not time (time is still stored in Firestore)
- Admin-only edit icon per row → inline fields for: `actionType` (select), `actionDate` (date input), `bookTitle` (text), `loanerName` (text)
- Save / cancel icons; saving calls `activityLogService.updateEntry()` — **no logging** of this edit

### 7c. Activity Log Service (`src/services/activityLogService.ts`)
- Add `updateEntry(id, data)` method using `updateDoc`

---

## 8. Activity Log — Manual Entry (follow-up)

### 8a. Log Page (`src/pages/ActivityLogPage.tsx`)
- Admin-only **"הוסף רשומה"** button above the table
- Clicking it pins an add row at the top of the table with inline fields:
  - `תאריך` — date input (default: today)
  - `פעולה` — action type select (default: `add`)
  - `שם הספר` — text field (required; Save disabled if empty)
  - `שם השואל` — text field (optional)
  - `בוצע על ידי` — text field (pre-filled with logged-in user email, editable)
- Save / cancel icons; on save calls `activityLogService.addManualEntry()` → reloads

### 8b. Log Service (`src/services/activityLogService.ts`)
- Add `addManualEntry(data)` method — calls `addDoc`; uses `Timestamp.fromDate` from the date field
- `bookId` set to `'manual'` (required by type but not meaningful here)
- No recursive logging of this action

---

## Access Rules (confirmed)
- **Activity Log:** Admin-only (read + write)
- **Wishlist:** Visible to all, editable by admins only
