"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchBookByDanacode = fetchBookByDanacode;
let _axios;
let _cheerio;
function getAxios() {
    if (!_axios)
        _axios = require("axios").default || require("axios");
    return _axios;
}
function getCheerio() {
    if (!_cheerio)
        _cheerio = require("cheerio");
    return _cheerio;
}
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const REQUEST_TIMEOUT = 10_000;
/**
 * Convert a 12-digit long danacode to short display format (P-I).
 * Inline implementation — cannot import from frontend src/.
 */
function toShortDanacode(long) {
    if (!/^\d{12}$/.test(long))
        return long;
    const publisher = String(parseInt(long.substring(0, 4), 10));
    const internal = String(parseInt(long.substring(4, 11), 10));
    return `${publisher}-${internal}`;
}
/**
 * Normalize any danacode input to its short form for search queries.
 * Accepts: "080002610032", "800-261003", "0800-0261003", etc.
 */
function normalizeDanacodeForSearch(input) {
    const trimmed = input.trim().replace(/\s/g, "");
    // Already short format
    if (/^\d{1,4}-\d{1,7}$/.test(trimmed)) {
        const [pub, int_] = trimmed.split("-");
        return `${parseInt(pub, 10)}-${parseInt(int_, 10)}`;
    }
    // Long 12-digit format
    if (/^\d{12}$/.test(trimmed)) {
        return toShortDanacode(trimmed);
    }
    // 11-digit (no control digit)
    if (/^\d{11}$/.test(trimmed)) {
        const publisher = String(parseInt(trimmed.substring(0, 4), 10));
        const internal = String(parseInt(trimmed.substring(4, 11), 10));
        return `${publisher}-${internal}`;
    }
    return trimmed;
}
// ─── Bookme.co.il Scraper ────────────────────────────────────────────
/**
 * Search bookme.co.il by danacode using their search-suggestions API,
 * then scrape the product page for book details.
 *
 * Step 1: GET /search-suggestions?word=<danacode> → HTML with product link
 * Step 2: GET <product-url> → extract title, author, publisher, cover image
 */
async function scrapeFromBookme(danacode) {
    const shortCode = normalizeDanacodeForSearch(danacode);
    const suggestUrl = `https://www.bookme.co.il/search-suggestions?word=${encodeURIComponent(shortCode)}`;
    console.log(`[Bookme] Searching: ${suggestUrl}`);
    const suggestResponse = await getAxios().get(suggestUrl, {
        headers: { "User-Agent": USER_AGENT },
        timeout: REQUEST_TIMEOUT,
    });
    const $suggest = getCheerio().load(suggestResponse.data);
    const firstLink = $suggest("a").first().attr("href");
    if (!firstLink) {
        console.log("[Bookme] No results in search suggestions");
        return null;
    }
    const productUrl = firstLink.startsWith("http")
        ? firstLink
        : `https://www.bookme.co.il${firstLink}`;
    console.log(`[Bookme] Found product page: ${productUrl}`);
    const productResponse = await getAxios().get(productUrl, {
        headers: { "User-Agent": USER_AGENT },
        timeout: REQUEST_TIMEOUT,
    });
    const $ = getCheerio().load(productResponse.data);
    const result = {};
    // --- Title (from H1) ---
    const h1 = $("h1").first().text().trim();
    if (h1)
        result.title = h1;
    // --- Cover Image (from OG meta tag) ---
    // URLs ending with "book.jpg" are generic placeholders — treat as no image found.
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) {
        const fullImage = ogImage.startsWith("http")
            ? ogImage
            : `https://www.bookme.co.il${ogImage}`;
        if (!fullImage.endsWith("book.jpg")) {
            result.coverImageUrl = fullImage;
        }
    }
    // --- Extract labeled fields from spans/divs ---
    // Bookme uses elements like: <span>שם המחבר:</span> <span>Name</span>
    // or similar label-value patterns in short text elements
    const labelMap = {};
    $("span, div, p, td, li, label, strong, b").each((_i, el) => {
        const text = $(el).text().trim().replace(/\s+/g, " ");
        if (text.length > 3 && text.length < 150) {
            // Look for "Label: Value" patterns
            const colonMatch = text.match(/^(שם המחבר|הוצאה|מק"ט|שנת הוצאה|מספר עמודים|מתרגם|שפה|ISBN)\s*:\s*(.+)$/);
            if (colonMatch) {
                labelMap[colonMatch[1]] = colonMatch[2].trim();
            }
        }
    });
    console.log("[Bookme] Labeled fields found:", labelMap);
    // --- Author ---
    if (labelMap["שם המחבר"]) {
        result.authors = [labelMap["שם המחבר"]];
    }
    // --- Publisher ---
    if (labelMap["הוצאה"]) {
        result.publishingHouse = labelMap["הוצאה"];
    }
    // --- Year ---
    if (labelMap["שנת הוצאה"]) {
        const year = parseInt(labelMap["שנת הוצאה"], 10);
        if (!isNaN(year) && year > 1000 && year < 2100)
            result.publishedYear = year;
    }
    // --- Pages ---
    if (labelMap["מספר עמודים"]) {
        const pages = parseInt(labelMap["מספר עמודים"], 10);
        if (!isNaN(pages))
            result.numberOfPages = pages;
    }
    // --- Translator ---
    if (labelMap["מתרגם"]) {
        result.translatedBy = labelMap["מתרגם"];
    }
    // --- Language ---
    if (labelMap["שפה"]) {
        result.language = labelMap["שפה"];
    }
    // --- ISBN ---
    if (labelMap["ISBN"]) {
        result.isbn = labelMap["ISBN"].trim();
    }
    // Check we extracted something useful
    if (!result.title && !result.authors) {
        console.log("[Bookme] Could not extract book data");
        return null;
    }
    console.log("[Bookme] Extracted:", result);
    return result;
}
/**
 * Enrich book data using Simania's JSON API by searching for the book title.
 * Simania doesn't support danacode search, but once we have a title from
 * Bookme, we can search Simania for additional details (pages, year, etc.).
 */
async function enrichFromSimania(partial) {
    if (!partial.title)
        return partial;
    const searchUrl = `https://simania.co.il/api/search?query=${encodeURIComponent(partial.title)}`;
    console.log(`[Simania] Enriching with title search: ${searchUrl}`);
    const response = await getAxios().get(searchUrl, {
        headers: { "User-Agent": USER_AGENT },
        timeout: REQUEST_TIMEOUT,
    });
    if (!response.data.success || response.data.data.books.length === 0) {
        console.log("[Simania] No enrichment results found");
        return partial;
    }
    // Find the best matching book (exact title match preferred)
    const books = response.data.data.books;
    const match = books.find((b) => b.NAME.trim() === partial.title?.trim()) || books[0];
    console.log(`[Simania] Matched: "${match.NAME}" by ${match.AUTHOR}`);
    // Only fill in missing fields
    if (!partial.publishedYear && match.YEAR) {
        partial.publishedYear = match.YEAR;
    }
    if (!partial.numberOfPages && match.PAGES) {
        partial.numberOfPages = match.PAGES;
    }
    if (!partial.publishingHouse && match.PUBLISHER) {
        partial.publishingHouse = match.PUBLISHER;
    }
    if (!partial.authors && match.AUTHOR) {
        partial.authors = [match.AUTHOR];
    }
    if (!partial.translatedBy && match.TRANSLATOR) {
        partial.translatedBy = match.TRANSLATOR;
    }
    if (!partial.coverImageUrl && match.hasImage && match.imageLink) {
        partial.coverImageUrl = match.imageLink.startsWith("http")
            ? match.imageLink
            : `https://simania.co.il${match.imageLink}`;
    }
    if (!partial.isbn && match.ISBN) {
        partial.isbn = match.ISBN;
    }
    return partial;
}
// ─── Opus.co.il Scraper ─────────────────────────────────────────────
/**
 * Scrape book data from opus.co.il by danacode.
 * Opus uses the short danacode format in the URL:
 *   https://opus.co.il/?id=showbook&catnum=348-7195
 * Some books also work with just the internal number:
 *   https://opus.co.il/?id=showbook&catnum=7164
 *
 * Extracts: numberOfPages, weight, translationPublishingYear, translatedBy,
 *           danacode (מסת"ב), title, authors, coverImageUrl.
 * Sets publishingHouse to "אופוס" for books found on this site.
 */
async function scrapeFromOpus(danacode) {
    const shortCode = normalizeDanacodeForSearch(danacode);
    // Try full short-format first (e.g. "348-7195"), then just the internal part
    const candidates = [shortCode];
    const dashIdx = shortCode.indexOf("-");
    if (dashIdx !== -1) {
        candidates.push(shortCode.substring(dashIdx + 1));
    }
    for (const catnum of candidates) {
        const url = `https://opus.co.il/?id=showbook&catnum=${encodeURIComponent(catnum)}`;
        console.log(`[Opus] Trying: ${url}`);
        let html;
        try {
            const response = await getAxios().get(url, {
                headers: { "User-Agent": USER_AGENT },
                timeout: REQUEST_TIMEOUT,
            });
            html = response.data;
        }
        catch (err) {
            console.log(`[Opus] Request failed for catnum=${catnum}:`, err instanceof Error ? err.message : err);
            continue;
        }
        const $ = getCheerio().load(html);
        // Check if this is a valid book page (has an H1 with a title)
        const h1 = $("h1").first().text().trim();
        if (!h1) {
            console.log(`[Opus] No H1 found for catnum=${catnum}, skipping`);
            continue;
        }
        const result = {};
        result.title = h1;
        result.publishingHouse = "אופוס";
        // Extract labeled fields from the page.
        // Opus uses label-value patterns in various elements.
        // We scan for Hebrew labels: עמודים, משקל, שנת הוצאה, תרגום, מסת"ב
        const labelMap = {};
        $("span, div, p, td, li, label, strong, b, dt, dd").each((_i, el) => {
            const text = $(el).text().trim().replace(/\s+/g, " ");
            if (text.length > 2 && text.length < 200) {
                // "Label: Value" pattern
                const colonMatch = text.match(/^(עמודים|משקל|שנת הוצאה|תרגום|מסת"ב|מסת״ב|ISBN)\s*:\s*(.+)$/);
                if (colonMatch) {
                    labelMap[colonMatch[1]] = colonMatch[2].trim();
                }
            }
        });
        console.log("[Opus] Labeled fields found:", labelMap);
        // --- Pages ---
        const pagesKey = Object.keys(labelMap).find((k) => k === "עמודים");
        if (pagesKey) {
            const pages = parseInt(labelMap[pagesKey], 10);
            if (!isNaN(pages) && pages > 0)
                result.numberOfPages = pages;
        }
        // --- Weight ---
        const weightKey = Object.keys(labelMap).find((k) => k === "משקל");
        if (weightKey) {
            const w = parseFloat(labelMap[weightKey].replace(/[^\d.]/g, ""));
            if (!isNaN(w) && w > 0)
                result.weight = w;
        }
        // --- Year (translation publishing year, since Opus publishes translations) ---
        const yearKey = Object.keys(labelMap).find((k) => k === "שנת הוצאה");
        if (yearKey) {
            const year = parseInt(labelMap[yearKey], 10);
            if (!isNaN(year) && year > 1000 && year < 2100) {
                result.translationPublishingYear = year;
            }
        }
        // --- Translator ---
        const transKey = Object.keys(labelMap).find((k) => k === "תרגום");
        if (transKey) {
            result.translatedBy = labelMap[transKey];
        }
        // --- ISBN (labeled as מסת"ב or ISBN on Opus) ---
        const isbnKey = Object.keys(labelMap).find((k) => k === 'מסת"ב' || k === "מסת״ב" || k === "ISBN");
        if (isbnKey) {
            const val = labelMap[isbnKey].trim();
            if (val)
                result.isbn = val;
        }
        // --- Author (from breadcrumb or contributor link) ---
        const authorLink = $('a[href*="showcontrib"]').first().text().trim();
        if (authorLink) {
            result.authors = [authorLink];
        }
        // --- Cover Image ---
        const ogImage = $('meta[property="og:image"]').attr("content");
        if (ogImage) {
            result.coverImageUrl = ogImage.startsWith("http")
                ? ogImage
                : `https://opus.co.il${ogImage}`;
        }
        // Check we got something useful
        if (!result.title && !result.authors) {
            console.log("[Opus] Could not extract book data");
            continue;
        }
        console.log("[Opus] Extracted:", result);
        return result;
    }
    return null;
}
// ─── Ybook.co.il (Yedioth) Scraper ──────────────────────────────────
/**
 * Normalize danacode to dashless short format for Ybook URLs.
 * "348-7195" → "3487195", "003600215032" → "3600215" (strip leading zeros + control).
 */
function danacodeForYbook(input) {
    const short = normalizeDanacodeForSearch(input);
    // Remove the dash
    return short.replace("-", "");
}
/**
 * Scrape book data from ybook.co.il (Yedioth Books) by danacode.
 * Ybook uses the short danacode without dash in the URL:
 *   https://ybook.co.il/products/3621503
 *
 * Extracts: publishingHouse (הוצאה), numberOfPages (מס' עמודים),
 *           originalLanguage (שפת מקור), originalTitle (שם הספר בלועזית),
 *           isbn (ISBN), title, authors, coverImageUrl.
 */
async function scrapeFromYbook(danacode) {
    const code = danacodeForYbook(danacode);
    const url = `https://ybook.co.il/products/${encodeURIComponent(code)}`;
    console.log(`[Ybook] Trying: ${url}`);
    let html;
    try {
        const response = await getAxios().get(url, {
            headers: { "User-Agent": USER_AGENT },
            timeout: REQUEST_TIMEOUT,
        });
        html = response.data;
    }
    catch (err) {
        console.log(`[Ybook] Request failed:`, err instanceof Error ? err.message : err);
        return null;
    }
    const $ = getCheerio().load(html);
    // Check for a valid product page (H1 with book title)
    const h1 = $("h1").first().text().trim();
    if (!h1) {
        console.log("[Ybook] No H1 found, not a valid book page");
        return null;
    }
    const result = {};
    result.title = h1;
    // Extract labeled fields from the page.
    // Ybook uses a "פרטים נוספים" section with label-value patterns.
    const labelMap = {};
    $("span, div, p, td, li, label, strong, b, dt, dd").each((_i, el) => {
        const text = $(el).text().trim().replace(/\s+/g, " ");
        if (text.length > 2 && text.length < 300) {
            const colonMatch = text.match(/^(הוצאה|מס' עמודים|שפת מקור|שם הספר בלועזית|שם המחבר\/ת בלועזית|דאנאקוד|ISBN|סוג כריכה)\s*[:\s]\s*(.+)$/);
            if (colonMatch) {
                labelMap[colonMatch[1]] = colonMatch[2].trim();
            }
        }
    });
    console.log("[Ybook] Labeled fields found:", labelMap);
    // --- Publisher ---
    if (labelMap["הוצאה"]) {
        result.publishingHouse = labelMap["הוצאה"];
    }
    // --- Pages ---
    if (labelMap["מס' עמודים"]) {
        const pages = parseInt(labelMap["מס' עמודים"], 10);
        if (!isNaN(pages) && pages > 0)
            result.numberOfPages = pages;
    }
    // --- Original Language ---
    if (labelMap["שפת מקור"]) {
        result.originalLanguage = labelMap["שפת מקור"];
    }
    // --- Original Title ---
    if (labelMap["שם הספר בלועזית"]) {
        result.originalTitle = labelMap["שם הספר בלועזית"];
    }
    // --- ISBN ---
    if (labelMap["ISBN"]) {
        result.isbn = labelMap["ISBN"].trim();
    }
    // --- Author (from contributor links or meta) ---
    const ogDesc = $('meta[property="og:description"]').attr("content") || "";
    // Try to find author from the page — Ybook often has author in the title area
    const authorEl = $('a[href*="/collections/"]').filter((_i, el) => {
        const href = $(el).attr("href") || "";
        return href.includes("/collections/") && !href.includes("category");
    }).first().text().trim();
    if (authorEl) {
        result.authors = [authorEl];
    }
    else if (ogDesc) {
        // OG description often ends with author name
        const match = ogDesc.match(/[\.\s]([^\.]+)$/);
        if (match) {
            const possibleAuthor = match[1].trim().replace(/\.$/, "");
            if (possibleAuthor.length > 2 && possibleAuthor.length < 50) {
                result.authors = [possibleAuthor];
            }
        }
    }
    // --- Cover Image ---
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) {
        result.coverImageUrl = ogImage.startsWith("http")
            ? ogImage
            : `https://ybook.co.il${ogImage}`;
    }
    // Check we got something useful
    if (!result.title) {
        console.log("[Ybook] Could not extract book data");
        return null;
    }
    console.log("[Ybook] Extracted:", result);
    return result;
}
// ─── Main Entry Point ────────────────────────────────────────────────
/**
 * Fetch book data by danacode.
 * 1. Searches bookme.co.il by danacode (their search-suggestions API)
 * 2. Enriches missing fields from simania.co.il JSON API (title search)
 * 3. Tries opus.co.il for Opus-published books (supports direct danacode URL)
 * 4. Tries ybook.co.il for Yedioth-published books (supports direct danacode URL)
 * Each source fills in only missing fields so earlier data is preserved.
 * Returns null if no data could be extracted from any source.
 */
async function fetchBookByDanacode(danacode) {
    if (!danacode || !danacode.trim()) {
        return null;
    }
    // Step 1: Get base data from Bookme (supports danacode search)
    let result = null;
    try {
        result = await scrapeFromBookme(danacode);
    }
    catch (err) {
        console.error("[Bookme] Scrape error:", err instanceof Error ? err.message : err);
    }
    // Step 2: Enrich with Simania data (title-based search for extra fields)
    if (result) {
        try {
            result = await enrichFromSimania(result);
        }
        catch (err) {
            console.error("[Simania] Enrichment error:", err instanceof Error ? err.message : err);
        }
    }
    // Step 3: Try Opus (publisher site — supports direct danacode URL lookup)
    try {
        const opusData = await scrapeFromOpus(danacode);
        if (opusData) {
            if (!result) {
                // Opus is the only source that returned data
                result = opusData;
            }
            else {
                // Merge Opus data into existing result (fill missing fields only)
                if (!result.numberOfPages && opusData.numberOfPages)
                    result.numberOfPages = opusData.numberOfPages;
                if (!result.weight && opusData.weight)
                    result.weight = opusData.weight;
                if (!result.translationPublishingYear && opusData.translationPublishingYear)
                    result.translationPublishingYear = opusData.translationPublishingYear;
                if (!result.translatedBy && opusData.translatedBy)
                    result.translatedBy = opusData.translatedBy;
                if (!result.coverImageUrl && opusData.coverImageUrl)
                    result.coverImageUrl = opusData.coverImageUrl;
                if (!result.authors && opusData.authors)
                    result.authors = opusData.authors;
                if (!result.title && opusData.title)
                    result.title = opusData.title;
                if (!result.publishingHouse && opusData.publishingHouse)
                    result.publishingHouse = opusData.publishingHouse;
                if (!result.isbn && opusData.isbn)
                    result.isbn = opusData.isbn;
            }
        }
    }
    catch (err) {
        console.error("[Opus] Scrape error:", err instanceof Error ? err.message : err);
    }
    // Step 4: Try Ybook / Yedioth (publisher site — supports direct danacode URL lookup)
    try {
        const ybookData = await scrapeFromYbook(danacode);
        if (ybookData) {
            if (!result) {
                result = ybookData;
            }
            else {
                // Merge Ybook data into existing result (fill missing fields only)
                if (!result.numberOfPages && ybookData.numberOfPages)
                    result.numberOfPages = ybookData.numberOfPages;
                if (!result.publishingHouse && ybookData.publishingHouse)
                    result.publishingHouse = ybookData.publishingHouse;
                if (!result.originalLanguage && ybookData.originalLanguage)
                    result.originalLanguage = ybookData.originalLanguage;
                if (!result.originalTitle && ybookData.originalTitle)
                    result.originalTitle = ybookData.originalTitle;
                if (!result.isbn && ybookData.isbn)
                    result.isbn = ybookData.isbn;
                if (!result.coverImageUrl && ybookData.coverImageUrl)
                    result.coverImageUrl = ybookData.coverImageUrl;
                if (!result.authors && ybookData.authors)
                    result.authors = ybookData.authors;
                if (!result.title && ybookData.title)
                    result.title = ybookData.title;
            }
        }
    }
    catch (err) {
        console.error("[Ybook] Scrape error:", err instanceof Error ? err.message : err);
    }
    return result;
}
//# sourceMappingURL=scrapeBookByDanacode.js.map