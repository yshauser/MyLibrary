export interface GoogleBookData {
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

export async function fetchBookByIsbn(isbn: string): Promise<GoogleBookData | null> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Google Books API error: ${response.status}`);

  const data = await response.json();
  console.log('Google Books raw response:', data);

  if (!data.items?.length) return null;

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

  return result;
}
