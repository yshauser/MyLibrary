/**
 * Standalone test script for the book scraper.
 * Runs the same scraping logic locally without Firebase.
 *
 * Usage:
 *   node scripts/testBookScraper.cjs 10-277916
 *   node scripts/testBookScraper.cjs 080002610032
 */

const axios = require('axios');
const cheerio = require('cheerio');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const REQUEST_TIMEOUT = 10000;

function toShortDanacode(long) {
  if (!/^\d{12}$/.test(long)) return long;
  const publisher = String(parseInt(long.substring(0, 4), 10));
  const internal = String(parseInt(long.substring(4, 11), 10));
  return `${publisher}-${internal}`;
}

function normalizeDanacodeForSearch(input) {
  const trimmed = input.trim().replace(/\s/g, '');

  if (/^\d{1,4}-\d{1,7}$/.test(trimmed)) {
    const [pub, int_] = trimmed.split('-');
    return `${parseInt(pub, 10)}-${parseInt(int_, 10)}`;
  }

  if (/^\d{12}$/.test(trimmed)) {
    return toShortDanacode(trimmed);
  }

  if (/^\d{11}$/.test(trimmed)) {
    const publisher = String(parseInt(trimmed.substring(0, 4), 10));
    const internal = String(parseInt(trimmed.substring(4, 11), 10));
    return `${publisher}-${internal}`;
  }

  return trimmed;
}

// ─── Bookme.co.il Scraper ────────────────────────────────────────────

async function scrapeFromBookme(danacode) {
  const shortCode = normalizeDanacodeForSearch(danacode);
  const suggestUrl = `https://www.bookme.co.il/search-suggestions?word=${encodeURIComponent(shortCode)}`;

  console.log(`[Bookme] Searching: ${suggestUrl}`);

  const suggestResponse = await axios.get(suggestUrl, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: REQUEST_TIMEOUT,
  });

  const $suggest = cheerio.load(suggestResponse.data);
  const firstLink = $suggest('a').first().attr('href');

  if (!firstLink) {
    console.log('[Bookme] No results in search suggestions');
    return null;
  }

  const productUrl = firstLink.startsWith('http')
    ? firstLink
    : `https://www.bookme.co.il${firstLink}`;

  console.log(`[Bookme] Found product page: ${productUrl}`);

  const productResponse = await axios.get(productUrl, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: REQUEST_TIMEOUT,
  });

  const $ = cheerio.load(productResponse.data);
  const result = {};

  // --- Title (from H1) ---
  const h1 = $('h1').first().text().trim();
  if (h1) result.title = h1;

  // --- Cover Image (from OG meta tag) ---
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) {
    result.coverImageUrl = ogImage.startsWith('http')
      ? ogImage
      : `https://www.bookme.co.il${ogImage}`;
  }

  // --- Extract labeled fields ---
  const labelMap = {};
  $('span, div, p, td, li, label, strong, b').each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, ' ');
    if (text.length > 3 && text.length < 150) {
      const colonMatch = text.match(
        /^(שם המחבר|הוצאה|מק"ט|שנת הוצאה|מספר עמודים|מתרגם|שפה|ISBN)\s*:\s*(.+)$/
      );
      if (colonMatch) {
        labelMap[colonMatch[1]] = colonMatch[2].trim();
      }
    }
  });

  console.log('[Bookme] Labeled fields:', labelMap);

  if (labelMap['שם המחבר']) result.authors = [labelMap['שם המחבר']];
  if (labelMap['הוצאה']) result.publishingHouse = labelMap['הוצאה'];
  if (labelMap['שנת הוצאה']) {
    const year = parseInt(labelMap['שנת הוצאה'], 10);
    if (!isNaN(year) && year > 1000 && year < 2100) result.publishedYear = year;
  }
  if (labelMap['מספר עמודים']) {
    const pages = parseInt(labelMap['מספר עמודים'], 10);
    if (!isNaN(pages)) result.numberOfPages = pages;
  }
  if (labelMap['מתרגם']) result.translatedBy = labelMap['מתרגם'];
  if (labelMap['שפה']) result.language = labelMap['שפה'];

  if (!result.title && !result.authors) {
    console.log('[Bookme] Could not extract book data');
    return null;
  }

  return result;
}

// ─── Simania.co.il JSON API (enrichment) ─────────────────────────────

async function enrichFromSimania(partial) {
  if (!partial.title) return partial;

  const searchUrl = `https://simania.co.il/api/search?query=${encodeURIComponent(partial.title)}`;
  console.log(`[Simania] Enriching with title search: ${searchUrl}`);

  const response = await axios.get(searchUrl, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: REQUEST_TIMEOUT,
  });

  if (!response.data.success || response.data.data.books.length === 0) {
    console.log('[Simania] No enrichment results found');
    return partial;
  }

  const books = response.data.data.books;
  const match = books.find((b) => b.NAME.trim() === partial.title.trim()) || books[0];

  console.log(`[Simania] Matched: "${match.NAME}" by ${match.AUTHOR}`);

  if (!partial.publishedYear && match.YEAR) partial.publishedYear = match.YEAR;
  if (!partial.numberOfPages && match.PAGES) partial.numberOfPages = match.PAGES;
  if (!partial.publishingHouse && match.PUBLISHER) partial.publishingHouse = match.PUBLISHER;
  if (!partial.authors && match.AUTHOR) partial.authors = [match.AUTHOR];
  if (!partial.translatedBy && match.TRANSLATOR) partial.translatedBy = match.TRANSLATOR;
  if (!partial.coverImageUrl && match.hasImage && match.imageLink) {
    partial.coverImageUrl = match.imageLink.startsWith('http')
      ? match.imageLink
      : `https://simania.co.il${match.imageLink}`;
  }

  return partial;
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const danacode = process.argv[2];

  if (!danacode) {
    console.error('Usage: node scripts/testBookScraper.cjs <danacode>');
    console.error('Examples:');
    console.error('  node scripts/testBookScraper.cjs 10-277916');
    console.error('  node scripts/testBookScraper.cjs 080002610032');
    process.exit(1);
  }

  console.log(`\nSearching for danacode: ${danacode}`);
  console.log(`Normalized: ${normalizeDanacodeForSearch(danacode)}`);
  console.log('─'.repeat(50));

  // Step 1: Get base data from Bookme
  let result = null;
  try {
    console.log('\n📚 Step 1: Searching Bookme.co.il...');
    result = await scrapeFromBookme(danacode);
  } catch (err) {
    console.error('[Bookme] Error:', err.message);
  }

  if (!result) {
    console.log('\n❌ No book found on Bookme.');
    process.exit(0);
  }

  console.log('\n📖 Bookme result:', JSON.stringify(result, null, 2));

  // Step 2: Enrich with Simania
  try {
    console.log('\n📚 Step 2: Enriching from Simania.co.il...');
    result = await enrichFromSimania(result);
  } catch (err) {
    console.error('[Simania] Enrichment error:', err.message);
  }

  console.log('\n✅ Final result:');
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
