import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Book data returned by the scraper.
 * Matches the frontend GoogleBookData interface.
 */
export interface ScrapedBookData {
  title?: string;
  originalTitle?: string;
  authors?: string[];
  translatedBy?: string;
  publishedYear?: number;
  publishingHouse?: string;
  language?: string;
  numberOfPages?: number;
  coverImageUrl?: string;
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const REQUEST_TIMEOUT = 10_000;

/**
 * Convert a 12-digit long danacode to short display format (P-I).
 * Inline implementation — cannot import from frontend src/.
 */
function toShortDanacode(long: string): string {
  if (!/^\d{12}$/.test(long)) return long;
  const publisher = String(parseInt(long.substring(0, 4), 10));
  const internal = String(parseInt(long.substring(4, 11), 10));
  return `${publisher}-${internal}`;
}

/**
 * Normalize any danacode input to its short form for search queries.
 * Accepts: "080002610032", "800-261003", "0800-0261003", etc.
 */
function normalizeDanacodeForSearch(input: string): string {
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
async function scrapeFromBookme(
  danacode: string
): Promise<ScrapedBookData | null> {
  const shortCode = normalizeDanacodeForSearch(danacode);

  const suggestUrl = `https://www.bookme.co.il/search-suggestions?word=${encodeURIComponent(shortCode)}`;
  console.log(`[Bookme] Searching: ${suggestUrl}`);

  const suggestResponse = await axios.get<string>(suggestUrl, {
    headers: { "User-Agent": USER_AGENT },
    timeout: REQUEST_TIMEOUT,
  });

  const $suggest = cheerio.load(suggestResponse.data);
  const firstLink = $suggest("a").first().attr("href");

  if (!firstLink) {
    console.log("[Bookme] No results in search suggestions");
    return null;
  }

  const productUrl = firstLink.startsWith("http")
    ? firstLink
    : `https://www.bookme.co.il${firstLink}`;

  console.log(`[Bookme] Found product page: ${productUrl}`);

  const productResponse = await axios.get<string>(productUrl, {
    headers: { "User-Agent": USER_AGENT },
    timeout: REQUEST_TIMEOUT,
  });

  const $ = cheerio.load(productResponse.data);
  const result: ScrapedBookData = {};

  // --- Title (from H1) ---
  const h1 = $("h1").first().text().trim();
  if (h1) result.title = h1;

  // --- Cover Image (from OG meta tag) ---
  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) {
    result.coverImageUrl = ogImage.startsWith("http")
      ? ogImage
      : `https://www.bookme.co.il${ogImage}`;
  }

  // --- Extract labeled fields from spans/divs ---
  // Bookme uses elements like: <span>שם המחבר:</span> <span>Name</span>
  // or similar label-value patterns in short text elements
  const labelMap: Record<string, string> = {};
  $("span, div, p, td, li, label, strong, b").each((_i, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text.length > 3 && text.length < 150) {
      // Look for "Label: Value" patterns
      const colonMatch = text.match(
        /^(שם המחבר|הוצאה|מק"ט|שנת הוצאה|מספר עמודים|מתרגם|שפה|ISBN)\s*:\s*(.+)$/
      );
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
    if (!isNaN(year) && year > 1000 && year < 2100) result.publishedYear = year;
  }

  // --- Pages ---
  if (labelMap["מספר עמודים"]) {
    const pages = parseInt(labelMap["מספר עמודים"], 10);
    if (!isNaN(pages)) result.numberOfPages = pages;
  }

  // --- Translator ---
  if (labelMap["מתרגם"]) {
    result.translatedBy = labelMap["מתרגם"];
  }

  // --- Language ---
  if (labelMap["שפה"]) {
    result.language = labelMap["שפה"];
  }

  // Check we extracted something useful
  if (!result.title && !result.authors) {
    console.log("[Bookme] Could not extract book data");
    return null;
  }

  console.log("[Bookme] Extracted:", result);
  return result;
}

// ─── Simania.co.il JSON API ──────────────────────────────────────────

interface SimaniaBook {
  ID: number;
  NAME: string;
  AUTHOR: string;
  AUTHORFIRSTNAME: string;
  AUTHORLASTNAME: string;
  PUBLISHER: string;
  YEAR: number;
  PAGES: number;
  imageLink: string;
  hasImage: number;
  TRANSLATOR: string;
  ISBN: string;
  SERIES: string;
  seriesNumber: string;
}

interface SimaniaSearchResponse {
  success: boolean;
  data: {
    books: SimaniaBook[];
    pagination: { totalResults: number };
  };
}

/**
 * Enrich book data using Simania's JSON API by searching for the book title.
 * Simania doesn't support danacode search, but once we have a title from
 * Bookme, we can search Simania for additional details (pages, year, etc.).
 */
async function enrichFromSimania(
  partial: ScrapedBookData
): Promise<ScrapedBookData> {
  if (!partial.title) return partial;

  const searchUrl = `https://simania.co.il/api/search?query=${encodeURIComponent(partial.title)}`;
  console.log(`[Simania] Enriching with title search: ${searchUrl}`);

  const response = await axios.get<SimaniaSearchResponse>(searchUrl, {
    headers: { "User-Agent": USER_AGENT },
    timeout: REQUEST_TIMEOUT,
  });

  if (!response.data.success || response.data.data.books.length === 0) {
    console.log("[Simania] No enrichment results found");
    return partial;
  }

  // Find the best matching book (exact title match preferred)
  const books = response.data.data.books;
  const match =
    books.find(
      (b) => b.NAME.trim() === partial.title?.trim()
    ) || books[0];

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

  return partial;
}

// ─── Main Entry Point ────────────────────────────────────────────────

/**
 * Fetch book data by danacode.
 * 1. Searches bookme.co.il by danacode (their search-suggestions API)
 * 2. Enriches missing fields from simania.co.il JSON API (title search)
 * Returns null if no data could be extracted.
 */
export async function fetchBookByDanacode(
  danacode: string
): Promise<ScrapedBookData | null> {
  if (!danacode || !danacode.trim()) {
    return null;
  }

  // Step 1: Get base data from Bookme (supports danacode search)
  let result: ScrapedBookData | null = null;
  try {
    result = await scrapeFromBookme(danacode);
  } catch (err) {
    console.error("[Bookme] Scrape error:", err instanceof Error ? err.message : err);
  }

  if (!result) {
    return null;
  }

  // Step 2: Enrich with Simania data (title-based search for extra fields)
  try {
    result = await enrichFromSimania(result);
  } catch (err) {
    console.error("[Simania] Enrichment error:", err instanceof Error ? err.message : err);
  }

  return result;
}
