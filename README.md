# הספרייה שלי — My Library

Personal library management app built with React, TypeScript, and Firebase.

## Features

- **Public view:** Searchable, sortable, filterable book table with expandable details
- **Admin management:** Add, edit, delete books (admin-only, via Firebase Auth)
- **Loan tracking:** Mark books as loaned, record returns, view loan history
- **Import/Export:** Bulk import from Excel/CSV, export library to file
- **Dashboard:** Statistics with charts (genre breakdown, reading status, top authors)
- **Hebrew RTL:** Full right-to-left Hebrew interface

## Tech Stack

- React 19 + Vite + TypeScript
- Material-UI (MUI) with RTL support
- Firebase (Firestore, Authentication, Hosting)
- Recharts for dashboard charts

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env` and fill in your Firebase config values.

### 3. Run development server
```bash
npm run dev
```

### 4. Set up admin user
1. Create a user in [Firebase Console](https://console.firebase.google.com/) > Authentication > Users
2. Enable Email/Password sign-in method in Authentication > Sign-in method
3. Download service account key from Project Settings > Service Accounts
4. Save it as `scripts/serviceAccountKey.json`
5. Run:
```bash
npm install firebase-admin
node scripts/setAdminClaim.cjs your-admin@email.com
```

### 5. Deploy Firestore rules
```bash
npx firebase deploy --only firestore:rules
```

### 6. Build for production
```bash
npm run build
```

### 7. Deploy to Firebase Hosting
```bash
npx firebase deploy --only hosting
```

## Project Structure

```
src/
  components/
    layout/       # Header, Footer, Layout
    books/        # BookTable, BookForm, BookExpandedRow, LoanDialog, DeleteConfirmDialog
  pages/          # LibraryPage, AddBookPage, EditBookPage, ExportPage, ImportPage, DashboardPage
  services/       # bookService, loanService (Firestore CRUD)
  contexts/       # AuthContext (Firebase Auth)
  types/          # TypeScript interfaces (Book, Author, LoanRecord, etc.)
  config/         # Firebase config, MUI theme, constants (genres, statuses)
scripts/          # Admin setup script (setAdminClaim)
firestore.rules   # Firestore security rules
firebase.json     # Firebase deployment config
```
