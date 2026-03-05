# Personal Library Management App — Implementation Plan

A Hebrew RTL React+Vite+TypeScript app with Firestore backend for managing a personal book library (400+ books), with public read access and admin-only editing.

---

## Project Context

- **Firebase project:** `mylibrary-68e73` — Firestore DB created, `.env` config provided
- **Library size:** 400+ books → requires pagination and efficient querying; bulk import is high priority
- **Admin login UX:** Subtle icon (e.g., small lock icon in footer), not a prominent nav item

---

## Tech Stack

- **Framework:** React 18 + Vite + TypeScript
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication (email/password for admin)
- **UI Library:** MUI (Material-UI) v5 — excellent RTL/Hebrew support, built-in data table with sort/filter/expand
- **Routing:** React Router v6
- **State Management:** React Context + hooks (lightweight enough, no Redux needed)
- **Export:** xlsx / csv libraries
- **Forms:** React Hook Form + Zod validation
- **Icons:** MUI Icons
- **Styling:** MUI theme + Emotion (comes with MUI)

---

## Data Model (Firestore)

### Collection: `books`
```
{
  id: string (auto-generated Firestore doc ID)
  internalId: string              // User's physical library ID
  title: string
  originalTitle?: string          // For translated books
  authors: [{ firstName: string, lastName: string }]  // Array, supports multiple
  language: string                // e.g. "עברית", "English"
  originalLanguage?: string
  isbn?: string
  publishedYear?: number
  translatedBy?: string
  translationPublishingYear?: number
  publishingHouse?: string
  edition?: string
  numberOfPages?: number
  coverImageUrl?: string
  series?: {
    name: string
    volumeNumber?: number
    volumePart?: number           // If a volume is split into parts
    totalVolumes?: number
    hasUntranslatedBooks?: boolean
  }
  genres: string[]                // Multiple genres allowed
  subGenres: string[]             // Multiple sub-genres allowed
  comments?: string
  physicalLocation?: string       // Shelf/room
  readingStatus?: 'unread' | 'reading' | 'read'
  personalRating?: number         // 1-5
  dateAdded: Timestamp
  currentLoan?: {                 // Denormalized for quick display
    loanerName: string
    loanDate: Timestamp
  } | null
}
```

### Subcollection: `books/{bookId}/loanHistory`
```
{
  id: string
  loanerName: string
  loanDate: Timestamp
  returnDate?: Timestamp
  notes?: string
}
```

### Collection: `genres` (optional, for dynamic management)
```
{
  id: string
  name: string        // Hebrew display name
  type: 'genre' | 'subGenre'
}
```

### Predefined Genres (Hebrew)
- מדע בדיוני (Sci-fi)
- פנטזיה (Fantasy)
- מותחן (Thriller)
- רומן (Novel)
- פוסט-אפוקליפטי (Post Apocalypse)
- ילדים (Kids)
- יהדות (Jewish)
- מסתורין (Mystery)
- רומנטיקה (Romance)
- היסטורי (Historical Fiction)
- ביוגרפיה (Biography)
- קומיקס (Comics / Graphic Novels)
- עיון ופנאי (Non-fiction)

### Predefined Sub-Genres
- נוער (Young Adults)
- אימה (Horror)

---

## Firestore Security Rules (Conceptual)
```
match /books/{bookId} {
  allow read: if true;                       // Public read
  allow write: if request.auth != null
    && request.auth.token.admin == true;     // Admin only write
}
```

---

## Implementation Steps

### Step 1: Project Scaffolding
- Initialize Vite + React + TypeScript project
- Install dependencies: MUI, Firebase SDK, React Router, React Hook Form, Zod, date-fns
- Configure RTL (MUI CacheProvider with stylis-plugin-rtl)
- Set Hebrew as default language, dir="rtl" on root
- Create MUI theme with RTL + Hebrew font (e.g., Heebo from Google Fonts)
- Set up project folder structure:
  ```
  src/
    components/     # Reusable UI components
    pages/          # Route pages
    services/       # Firebase service layer
    hooks/          # Custom hooks
    contexts/       # Auth context, etc.
    types/          # TypeScript interfaces
    config/         # Firebase config, constants
    utils/          # Helpers
  ```

### Step 2: Firebase Configuration
- Configure Firebase project `mylibrary-68e73`:
  - Enable Firestore (production mode)
  - Enable Authentication (email/password provider)
  - Enable Firebase Hosting
- Create `.env` file with Firebase config keys
- Initialize Firebase SDK in app (Firestore + Auth)
- Create TypeScript interfaces matching the data model above
- Build Firestore service layer:
  - `bookService`: CRUD operations for books (with pagination — 400+ docs)
  - `loanService`: Add loan, record return, get loan history
- Deploy Firestore security rules
- Create Firestore indexes for common sort/filter queries

### Step 3: Authentication & Authorization
- Create `AuthContext` provider wrapping the app
- **Subtle admin login:** small lock/key icon in the footer → opens a minimal login dialog (not a full page)
- Set admin custom claim via Firebase Admin SDK (one-time setup script)
- `useAuth` hook exposing: `user`, `isAdmin`, `login`, `logout`
- Conditional UI rendering based on `isAdmin`
- Protected route wrapper component for admin actions

### Step 4: Layout & Navigation
- App shell: header with app title, search bar, login/logout button
- Navigation: tabs — "ספרייה" (Library), "סטטיסטיקה" (Dashboard, visible to all)
- Admin-only nav items (shown only when logged in): "הוספת ספר" (Add Book), "ייצוא" (Export), "ייבוא" (Import)
- Footer with basic info
- Responsive layout (mobile-friendly)

### Step 5: Book Table (Public View) — Core Feature
- MUI DataGrid or custom table with:
  - **Columns:** Internal ID, Title, Author(s), Genre, Series, Reading Status, Loan Status
  - **Sorting:** Click column headers to sort
  - **Search:** Global text search across title, author, ISBN
  - **Filters:** Dropdowns/chips for genre, sub-genre, series, reading status, loan status (available/loaned)
  - **Expandable rows:** Click to expand and show full details (ISBN, publisher, edition, series info, comments, loan info, cover image)
- **Pagination** (server-side, ~50 books per page) — essential for 400+ books
- Real-time Firestore listener (onSnapshot) for live updates
- Client-side search with debounce; Firestore composite indexes for server-side filtering

### Step 6: Admin — Add / Edit Book
- Book form with:
  - All fields from the data model
  - Dynamic author fields (add/remove authors)
  - Series section that toggles open/closed
  - Genre/sub-genre multi-select chips
  - Form validation via Zod schema
- "Add Book" page with empty form
- "Edit Book" — pre-filled form, accessible from expanded row or action button
- ISBN auto-fill button (optional, calls Google Books API to populate fields)

### Step 7: Admin — Delete Book
- Delete button on each row (admin only)
- Confirmation dialog before deletion
- Also deletes loan history subcollection

### Step 8: Admin — Loan Management
- "Loan" button on each book row (admin only)
  - If not loaned: dialog to enter loaner name + date
  - If loaned: show current loan info, button to record return (auto-fills return date)
- Loan history dialog: table showing all past loans for a book (loaner, loan date, return date)

### Step 9: Export
- Export all books (or filtered subset) to:
  - CSV file
  - Excel file (using xlsx library)
- Download triggers via browser

### Step 10: Dashboard / Statistics (Nice-to-have)
- Total books count
- Books by genre (bar chart)
- Books currently on loan
- Recently added books
- Reading status breakdown
- Use a lightweight chart library (e.g., recharts)

### Step 11: Bulk Import (High Priority)
- Upload CSV/Excel file
- Column mapping UI (map CSV columns to book fields)
- Preview parsed data in a table with validation errors highlighted
- Confirm to import into Firestore (batch writes for performance)
- Duplicate detection (same ISBN or title+author combo)
- Progress indicator for large imports

### Step 12: Polish & Deploy
- Error handling & loading states throughout
- Empty states with helpful messages
- Toast notifications for actions (add, edit, delete, loan)
- PWA setup (optional, for mobile use)
- Deploy to Firebase Hosting
- Final testing & RTL/Hebrew review

---

## Priority Order
1. **Steps 1–5** → MVP: viewable library with search/sort/filter
2. **Steps 6–8** → Admin CRUD + loans
3. **Step 9 + 11** → Export + **Bulk Import** (high priority — needed to load 400+ existing books)
4. **Step 10** → Dashboard & statistics
5. **Step 12** → Polish & deploy to Firebase Hosting
