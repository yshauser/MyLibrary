# MyLibrary — Project Rules & Guidelines

## 1. Tech Stack & Versions

| Layer | Library | Version |
|---|---|---|
| Build tool | Vite | ^7 |
| UI framework | React | ^19 |
| Language | TypeScript | ~5.9 |
| Component library | MUI (Material UI) | ^7 |
| MUI icons | @mui/icons-material | ^7 |
| Routing | react-router-dom | ^7 |
| Forms | react-hook-form + zod | ^7 / ^4 |
| Charts | recharts | ^3 |
| Backend | Firebase (Firestore + Auth) | ^12 |
| Spreadsheet | xlsx | ^0.18 |
| RTL CSS | stylis-plugin-rtl | ^2 |

---

## 2. Project Structure

```
src/
  components/
    books/          # Book-specific UI components
    layout/         # App shell: Header, Footer, Layout
  config/
    constants.ts    # All app-wide constants (genres, statuses, etc.)
    firebase.ts     # Firebase app initialization
    theme.ts        # MUI theme (RTL, colors, typography)
  contexts/
    AuthContext.tsx  # Auth state + useAuth() hook
  pages/            # One file per route
  services/         # One file per Firestore collection
  types/            # TypeScript interfaces per domain entity
  main.tsx          # Entry point: providers, RTL cache
  App.tsx           # Router + route definitions
```

**Naming conventions:**
- Files: `PascalCase.tsx` for components and pages, `camelCase.ts` for services, types, config
- Exported functions/components: `PascalCase` named exports (no default anonymous arrows)
- Constants: `SCREAMING_SNAKE_CASE`
- Firestore collection name strings: `camelCase` constant at top of each service file

---

## 3. TypeScript Rules

Configured in `tsconfig.app.json`:

- **Target:** `ES2022`
- **Strict mode:** `strict: true` — all strict checks enabled
- **No unused locals/params:** `noUnusedLocals: true`, `noUnusedParameters: true`
- **Module syntax:** `verbatimModuleSyntax: true` — use `import type` for type-only imports
- **Module resolution:** `bundler` (Vite-compatible)
- **No emit:** `noEmit: true` — Vite handles the actual build
- **No fallthrough:** `noFallthroughCasesInSwitch: true`

Always use `import type { Foo }` when importing only types — never mix value and type imports in one statement without the `type` keyword.

---

## 4. RTL, Language & Locale

The app is **entirely in Hebrew** and uses **RTL layout**:

- `theme.direction: 'rtl'` set in `src/config/theme.ts`
- RTL CSS handled by `stylis-plugin-rtl` via `@emotion/cache` with `key: 'muirtl'`
- Font: `"Heebo", "Arial", sans-serif`
- All MUI component text overridden to `textAlign: 'start'` (RTL-safe, not `right`)
- `MuiInputLabel` overridden to anchor from the right (`right: 0`, `transformOrigin: 'top right'`)
- UI strings: **all in Hebrew** — labels, tooltips, placeholders, error messages
- Dates: `toLocaleDateString('he-IL')` for display

---

## 5. MUI Theming & Component Usage

### Colors
- **Primary:** `#1565c0` (blue) / light `#5e92f3` / dark `#003c8f`
- **Secondary:** `#ff8f00` (amber) / light `#ffc046` / dark `#c56000`
- **Background default:** `#f5f5f5`

### Rules
- All theming lives in `src/config/theme.ts` — never inline `createTheme` elsewhere
- MUI component overrides go in the `components` section of the theme, not in `sx` props
- Use `sx` prop for one-off layout tweaks; use theme overrides for systematic style changes
- Use `size="small"` for table rows and dense form controls; use `size="medium"` (default) for standalone admin action buttons to ensure ≥44px touch targets on mobile
- Prefer MUI `Stack`, `Box`, `Grid` for layout — avoid raw CSS classes

### Responsive / Mobile
- Detect mobile with: `const isMobile = useMediaQuery(theme.breakpoints.down('sm'))`
- Always import `useTheme` and `useMediaQuery` from `@mui/material`
- On mobile (`xs`/`sm`): render card/list views instead of tables
- On mobile: collapsible filter panels, larger touch targets, `Fab` for primary actions
- Breakpoint used for mobile/desktop branch: `sm` (600px)

---

## 6. Firebase & Firestore

### Initialization
All Firebase config comes from `VITE_` environment variables — never hardcode credentials:

```ts
// src/config/firebase.ts
export const db = getFirestore(app);
export const auth = getAuth(app);
```

### Collections

| Collection | Read | Write |
|---|---|---|
| `books` | Public | Admin only |
| `books/{id}/loanHistory` | Public | Admin only |
| `activityLog` | Admin only | Admin only |
| `wishlist` | Public | Admin only |

### Firestore patterns
- Each service file defines `const COLLECTION_NAME = '...'` and `const collRef = collection(db, COLLECTION_NAME)` at the top
- Always strip `undefined` fields before saving (use `removeUndefined()` helper in `bookService`)
- Use `writeBatch` for bulk operations; max 500 writes per batch
- `Timestamp` from `firebase/firestore` is used for all date fields in interfaces and when saving
- Dates displayed via `.toDate().toLocaleDateString('he-IL')`

---

## 7. Service Layer Pattern

Services are **plain objects** with async methods — no classes:

```ts
export const bookService = {
  async getBooks(...): Promise<...> { ... },
  async addBook(...): Promise<string> { ... },
};
```

Rules:
- One service file per Firestore collection
- Services live in `src/services/`
- All mutations (`add`, `edit`, `delete`, `loan`, `return`) **must call `activityLogService.logAction()`** — fire-and-forget with `.catch(() => {})`
- Activity log errors must never block the main operation
- Services are the **only place** that directly imports from `firebase/firestore`; components and pages call services, never Firestore directly

---

## 8. Type Definitions

- All interfaces live in `src/types/`, one file per domain entity
- Use `interface` for object shapes; use `type` for unions and mapped types
- Firestore `id` is always a `string` and always present in the read interface
- Form data types are `Omit<Entity, 'id' | 'dateAdded'>` (and optionally make `dateAdded` optional)
- `Timestamp` from `firebase/firestore` is used for date fields — never plain `Date` in interfaces
- Enum-like values use `as const` objects (see `READING_STATUSES`) or union types (see `ReadingStatus`, `ActivityType`)
- Display labels for enum values live alongside the type in the same file (e.g., `ACTIVITY_TYPE_LABELS`)

---

## 9. Authentication & Authorization

- Auth uses **Firebase Email/Password**
- Admin status is determined by a **custom claim** `admin: true` on the Firebase Auth token (set via Admin SDK script in `scripts/setAdminClaim.cjs`)
- `useAuth()` hook (from `AuthContext`) exposes: `user`, `isAdmin`, `loading`, `login()`, `logout()`
- Always call `useAuth()` — never access Firebase auth directly in components
- Admin-only routes are wrapped in `<AdminRoute>` in `App.tsx`:
  ```tsx
  function AdminRoute({ children }) {
    const { isAdmin, loading } = useAuth();
    if (loading) return null;
    if (!isAdmin) return <Navigate to="/" replace />;
    return <>{children}</>;
  }
  ```
- Admin-only UI sections are gated with `{isAdmin && (...)}` — never hide via CSS

---

## 10. Component Conventions

- **Named exports only** — `export default function BookTable(...)`, not `export default () => ...`
- **Props interface** defined inline above the component (not imported from types unless shared)
- Components receive data and callbacks as props — no direct Firestore calls inside components
- Pages (`src/pages/`) are allowed to call services directly and manage loading/error state
- Components (`src/components/`) must receive data as props
- Use `useMemo` for expensive filtering/sorting computations
- Local state: prefer `useState` with clear descriptive names; avoid prop-drilling more than 2 levels — use context for global state
- Error states: display with `<Alert severity="error">` from MUI; loading states: `<CircularProgress />`
- Tooltips: wrap all icon-only `IconButton` elements with `<Tooltip title="Hebrew label">`

---

## 11. Routing

- Router: `BrowserRouter` with `basename="/MyLibrary"` (GitHub Pages sub-path)
- Routes defined in `src/App.tsx` only
- Route paths: lowercase, hyphen-separated (e.g., `/edit/:id`)
- All `*` unmatched routes redirect to `/`
- Admin routes: `/add`, `/edit/:id`, `/export`, `/import`, `/log`
- Public routes: `/`, `/dashboard`, `/wishlist`

---

## 12. Constants

All app-wide constants live in `src/config/constants.ts`:

- `GENRES` — array of Hebrew genre strings, `as const`
- `SUB_GENRES` — array of Hebrew sub-genre strings, `as const`
- `READING_STATUSES` — object mapping status keys to Hebrew labels, `as const`
- `BOOKS_PER_PAGE` — pagination default (50)

Rules:
- Never hardcode genre/status strings in components — always import from constants
- When adding a new constant, add it to `constants.ts` and update all relevant components

---

## 13. Environment Variables

All environment variables are prefixed with `VITE_` to be exposed by Vite:

| Variable | Purpose |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics (optional) |
| `VITE_GOOGLE_VISION_API_KEY` | Google Cloud Vision (ISBN OCR scanner) |

Rules:
- Never commit `.env` — only `.env.example` is committed
- In CI (GitHub Actions), all vars are stored as repository secrets
- Access via `import.meta.env.VITE_*` in source code

---

## 14. Linting

ESLint config (`eslint.config.js`):
- `typescript-eslint` recommended rules
- `eslint-plugin-react-hooks` — enforces rules of hooks
- `eslint-plugin-react-refresh` — ensures components are refresh-safe
- Target: `**/*.{ts,tsx}` files only
- `dist/` is ignored

Run: `npm run lint`

---

## 15. Build & Deployment

### Build
```bash
npm run dev       # Local dev server (Vite)
npm run build     # tsc -b && vite build → dist/
npm run preview   # Preview built output locally
```

### Deployment
- **Platform:** GitHub Pages
- **Base path:** `/MyLibrary` (set in `vite.config.ts` and `BrowserRouter`)
- **Trigger:** Push to `main` branch → GitHub Actions workflow (`.github/workflows/deploy.yml`)
- **Process:** `npm ci` → `npm run build` (with secrets injected) → upload `dist/` → deploy to Pages
- **Firebase Hosting** is configured in `firebase.json` as an alternative hosting option (SPA rewrite: all routes → `index.html`)
- **Firestore rules** deployed separately via Firebase CLI: `firebase deploy --only firestore:rules`
- Node version in CI: 20
