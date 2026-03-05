# OCR Camera Scanner for ISBN Field

Add a camera scan button next to the ISBN field that captures a live photo, sends it to Google Cloud Vision API, extracts digits from the result, and populates the ISBN field.

---

## Step 1 — Google Cloud Setup (manual, one-time)

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com) and create a new project (e.g. `mylibrary-ocr`)
2. Enable **Cloud Vision API**: APIs & Services → Enable APIs → search "Cloud Vision API" → Enable
3. Create an API key: APIs & Services → Credentials → Create Credentials → API Key
4. **Restrict the key**: Application restrictions → HTTP referrers → add your Firebase Hosting domain (e.g. `https://your-app.web.app/*`) + `http://localhost:5173/*` for dev
5. Copy the key — you will use it in Step 2

---

## Step 2 — Store the API Key Securely

The project already uses Vite `import.meta.env` for Firebase secrets (same pattern).

- Add to **`.env`** (local dev, already gitignored by Vite convention):
  ```
  VITE_GOOGLE_VISION_API_KEY=your_key_here
  ```
- Add to **GitHub Actions secrets** (for CI/build): `VITE_GOOGLE_VISION_API_KEY`
- Reference in code as `import.meta.env.VITE_GOOGLE_VISION_API_KEY`
- **Never commit the `.env` file** — add `.env` to `.gitignore` (will be created if missing)

> Note: Vite embeds `VITE_*` vars into the JS bundle at build time. The API key will be visible in the built JS, which is why the HTTP referrer restriction in Step 1 is important — it limits who can use the key.

---

## Step 3 — New Component: `IsbnScanner.tsx`
**File:** `src/components/books/IsbnScanner.tsx`

- MUI `Dialog` with a live `<video>` preview (via `getUserMedia`, rear camera preferred on mobile)
- A **"צלם"** (capture) button — takes a snapshot of the current frame into a hidden `<canvas>`
- Canvas image is base64-encoded and sent to Vision API (`DOCUMENT_TEXT_DETECTION` feature)
- Response text is filtered: extract only digit sequences of length 10 or 13 (ISBN format)
- If a valid ISBN is found → call `onScan(isbn)` → dialog closes and ISBN field is populated
- If no valid number found → show a retry message ("לא זוהה מספר ISBN — נסה שוב")
- Error state for camera permission denied
- Camera stream stopped on dialog close

---

## Step 4 — Changes to `BookForm.tsx`
**File:** `src/components/books/BookForm.tsx`

- Import `CameraAltIcon` and `IsbnScanner`
- Add camera icon button as `InputAdornment` (end) on the ISBN `TextField`
- Clicking opens `IsbnScanner` dialog
- `onScan` callback: sets `isbn` state + expands the "פרטים נוספים" Accordion

---

## Step 5 — `.gitignore` + `.env`
- Create `.env` with `VITE_GOOGLE_VISION_API_KEY=` placeholder
- Ensure `.gitignore` includes `.env`

---

## Notes
- Camera + HTTPS: works in production (Firebase Hosting is HTTPS); works in dev (localhost is exempt)
- Vision API `DOCUMENT_TEXT_DETECTION` is optimized for printed text — well suited for ISBN digits on book covers
- Free tier: 1000 units/month; each scan = 1 unit
- No new Firestore collections or routes needed
