# NLI + Google Books Fallback Lookup

Add a National Library of Israel (NLI) lookup as the primary source for book data by ISBN, with Google Books as fallback if NLI returns no results.

---

## Step 1 — Create `nliService.ts`
**File:** `src/services/nliService.ts`

Fetch from:
```
https://api.nli.org.il/openlibrary/search?api_key={VITE_SEARCH_API_KEY}&query=any,exact,{isbn}
```

### Field mapping from NLI JSON:

| App field | NLI field | Parsing |
|---|---|---|
| `title` | `dc:title` | Take text before ` / ` |
| `authors` | `dc:creator` | Take before `$$Q`, split `"lastName, firstName, year"` → `{firstName, lastName}` |
| `translatedBy` | `dc:contributor` | Take before `$$Q`, strip `((מתרגם))` and similar parenthetical suffixes, keep `"ברמן, רחביה"` format as-is |
| `publishingHouse` | `dc:publisher` | Take text after ` : ` (e.g. `"ת"א : אופוס"` → `"אופוס"`) |
| `publishedYear` | `dc:date` | Parse first 4 chars of `"20000101"` → `2000` |
| `numberOfPages` | `dc:format` | Extract leading digits from `"384 עמודים"` → `384` |
| `language` | `dc:language` | Map `"heb"` → `"עברית"`, `"eng"` → `"אנגלית"`, else use raw value |

> No cover image from NLI — Google Books fallback may supply it.

Returns `GoogleBookData | null` (reuses the same interface from `googleBooksService.ts`).

---

## Step 2 — Update `googleBooksService.ts`

Add `translatedBy` to the `GoogleBookData` interface (NLI provides it, Google Books does not — but the interface should be shared).

---

## Step 3 — Update `handleGoogleBooksLookup` in `BookForm.tsx`

```
1. Call nliService.fetchBookByIsbn(isbn)
2. If result → use it
3. If null → call googleBooksService.fetchBookByIsbn(isbn)
4. If both null → show "לא נמצא ספר"
```

Also fill `translatedBy` field from the result (NLI provides this, currently not filled by lookup).

---

## Notes
- `VITE_SEARCH_API_KEY` already added to `.env`, `deploy.yml`, and GitHub secrets
- NLI has no CORS issues (public API)
- Logging: both raw NLI response and mapped result logged to console
