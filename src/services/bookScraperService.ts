import type { GoogleBookData } from './googleBooksService';

/**
 * Fetch book data by danacode via the Cloud Function scraper.
 * The function scrapes simania.co.il and bookme.co.il server-side.
 *
 * Returns GoogleBookData for compatibility with applyLookupData().
 */
export async function fetchBookByDanacode(
  danacode: string
): Promise<GoogleBookData | null> {
  const baseUrl = import.meta.env.VITE_CLOUD_FUNCTION_BASE_URL;
  if (!baseUrl) {
    console.warn('Cloud Function base URL (VITE_CLOUD_FUNCTION_BASE_URL) is missing');
    return null;
  }

  const url = `${baseUrl}/scrapeBookByDanacodeFunc?danacode=${encodeURIComponent(danacode)}`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });

    if (response.status === 404) {
      console.log('Book scraper: no book found for danacode', danacode);
      return null;
    }

    if (!response.ok) {
      throw new Error(`Scraper API error: ${response.status}`);
    }

    const json = await response.json();
    console.log('Book scraper raw response:', json);

    if (!json.data) return null;

    const data = json.data as GoogleBookData;
    return data;
  } catch (err) {
    console.error('Book scraper error:', err);
    return null;
  }
}
