export interface GoogleBookData {
  title?: string;
  originalTitle?: string;
  authors?: string[];
  translatedBy?: string;
  publishedYear?: number;
  publishingHouse?: string;
  language?: string;
  numberOfPages?: number;
  weight?: number;
  translationPublishingYear?: number;
  isbn?: string;
  originalLanguage?: string;
  coverImageUrl?: string;
}

// In-memory cache: avoids re-fetching the same ISBN multiple times in a session.
// Resets on page refresh. Both successful results and "not found" (null) are cached.
const cache = new Map<string, GoogleBookData | null>();

export async function fetchBookByIsbn(isbn: string): Promise<GoogleBookData | null> {
  if (cache.has(isbn)) {
    console.log('Google Books cache hit for ISBN:', isbn);
    return cache.get(isbn)!;
  }

  // const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`; // for testing without API key
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
  const keyParam = apiKey ? `&key=${apiKey}` : '';
  // Request only the fields we actually use, reducing payload size and server load
  const fields = 'items(volumeInfo(title,subtitle,authors,publisher,pageCount,language,imageLinks/thumbnail,publishedDate))';
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&fields=${encodeURIComponent(fields)}${keyParam}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Google Books API error: ${response.status}`);

  const data = await response.json();
  console.log('Google Books raw response:', data);

  if (!data.items?.length) {
    cache.set(isbn, null);
    return null;
  }

  const info = data.items[0].volumeInfo;
  console.log('Google Books volumeInfo:', info);

  const result: GoogleBookData = {};

  if (info.title) result.title = info.title;
  if (info.subtitle) result.originalTitle = info.subtitle;
  if (info.authors?.length) result.authors = info.authors;
  if (info.publisher) result.publishingHouse = info.publisher;
  if (info.pageCount) result.numberOfPages = info.pageCount;
  if (info.language) result.language = info.language;
  if (info.imageLinks?.thumbnail) {
    result.coverImageUrl = info.imageLinks.thumbnail.replace('http://', 'https://');
  }

  if (info.publishedDate) {
    const year = parseInt(info.publishedDate.substring(0, 4), 10);
    if (!isNaN(year)) result.publishedYear = year;
  }

  cache.set(isbn, result);
  return result;
}
