# MyLibrary App — Full Feature Plan Overview

All existing features and their implementation status across the MyLibrary Hebrew book management app.

---

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **UI**: MUI (Material UI) v6, Recharts
- **Backend**: Firebase (Firestore + Auth)
- **Hosting**: GitHub Pages (`/MyLibrary` basename)
- **RTL**: Hebrew UI throughout

---

## Pages & Features

### `/` — Library Page (`LibraryPage.tsx`)
- Loads all books from Firestore via `bookService.getAllBooks()`
- Renders `BookTable` with search, filter, sort, paginate
- Admin-only: delete dialog, loan dialog
- Snackbar feedback on actions

### `/dashboard` — Statistics (`DashboardPage.tsx`)
- Summary stat cards: total, loaned, read, reading
- Bar chart: books by genre
- Pie chart: reading status distribution
- Top-10 authors list
- Uses `recharts` with `ResponsiveContainer`

### `/add` — Add Book (admin only, `AddBookPage.tsx`)
- Full `BookForm` with all fields
- ISBN scanner via `IsbnScanner.tsx` (camera barcode scan)
- Google Books + NLI lookup via `googleBooksService` / `nliService`

### `/edit/:id` — Edit Book (admin only, `EditBookPage.tsx`)
- Same `BookForm`, pre-filled from Firestore
- Saves updates via `bookService.updateBook()`

### `/wishlist` — Wishlist (`WishlistPage.tsx`)
- Table of desired books (bookName, series, volume, author, publisher)
- Inline add/edit/delete rows (admin only)
- Sort by any column
- Uses `wishlistService`

### `/export` — Export (admin only, `ExportPage.tsx`)
- Export all books to `.xlsx` or `.csv`
- Full field mapping (Hebrew column headers)
- Client-side via `xlsx` library

### `/import` — Import (admin only, `ImportPage.tsx`)
- Upload `.xlsx`/`.xls`/`.csv`
- Parse + validate rows, preview table
- Batch upsert via `bookService.batchUpsertBooks()`
- Download example file

### `/log` — Activity Log (admin only, `ActivityLogPage.tsx`)
- Table of all admin actions (add/edit/delete/loan/return)
- Sort, filter by type
- Admin can manually add/edit/delete log entries

---

## Components

### `BookTable.tsx`
- Search (title, author, ISBN, ID, series)
- Filters: genre, sub-genre, reading status, loan status
- Sortable columns: ID, title, author, genre, status
- Pagination (10/25/50/100 rows)
- Expandable rows → `BookExpandedRow`
- Mobile: hides genre/series/status/loan columns, shows `size="small"` table
- Admin: edit/loan/delete action buttons per row

### `BookExpandedRow.tsx`
- 4-column grid: book details, series info, classification/status, loan & comments
- Shows all fields including rating (`Rating` component)

### `BookForm.tsx`
- Full book metadata entry form
- Multi-author support
- Series fields
- ISBN scanner integration
- Google Books / NLI autofill

### `IsbnScanner.tsx`
- Camera-based barcode scanner
- Returns ISBN to parent form

### `LoanDialog.tsx`
- Set/clear loan on a book (loaner name + date)

### `DeleteConfirmDialog.tsx`
- Confirmation modal before deletion

### `Header.tsx`
- Desktop: tabs navigation + admin action icons
- Mobile: hamburger → right Drawer with nav + admin actions

### `Layout.tsx`
- Sticky header + scrollable main content + footer
- Padding: `xs:1, sm:2, md:3`

---

## Services

| Service | Responsibility |
|---|---|
| `bookService.ts` | CRUD + batch upsert for books |
| `loanService.ts` | Loan/return operations |
| `wishlistService.ts` | Wishlist CRUD |
| `activityLogService.ts` | Activity log CRUD |
| `googleBooksService.ts` | ISBN → metadata lookup (Google Books API) |
| `nliService.ts` | ISBN → metadata lookup (National Library of Israel) |

---

## Auth & Roles
- Firebase Auth (email/password)
- `isAdmin` flag via custom claim (`setAdminClaim.cjs` script)
- `AdminRoute` wrapper in `App.tsx` guards admin-only pages
- Non-admin users: read-only library, wishlist, dashboard

---

## Data Model (`Book`)
```
id, internalId, title, originalTitle,
authors[]{firstName, lastName},
language, originalLanguage, isbn,
publishedYear, translatedBy, translationPublishingYear,
publishingHouse, edition, numberOfPages,
coverImageUrl, series{name,volumeNumber,volumePart,totalVolumes,hasUntranslatedBooks},
genres[], subGenres[], comments, physicalLocation,
readingStatus (unread|reading|read|-/-),
personalRating (1-5), dateAdded, currentLoan{loanerName,loanDate}
```

---

## Config
- **Genres**: מדע בדיוני, פנטזיה, מותחן, רומן, פוסט-אפוקליפטי, ילדים, יהדות, מסתורין, רומנטיקה, היסטורי, ביוגרפיה, קומיקס, עיון ופנאי
- **Sub-genres**: נוער, אימה
- **Reading statuses**: לא נקרא, בקריאה, נקרא, -/-

---

## Deployment
- GitHub Actions → `deploy.yml` → GitHub Pages
- Firebase config via `.env` (Vite env vars)
- Firestore security rules in `firestore.rules`
