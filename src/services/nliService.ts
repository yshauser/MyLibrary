import type { GoogleBookData } from './googleBooksService';

const DC = 'http://purl.org/dc/elements/1.1/';

function dcVal(record: Record<string, unknown>, field: string): string {
  const arr = record[`${DC}${field}`] as Array<{ '@value'?: string }> | undefined;
  return arr?.[0]?.['@value'] ?? '';
}

function parseTitle(raw: string): string {
  const slashIdx = raw.indexOf(' / ');
  return (slashIdx !== -1 ? raw.substring(0, slashIdx) : raw).trim();
}

function parseAuthor(raw: string): { firstName: string; lastName: string } {
  const clean = raw.split('$$Q')[0].trim();
  // Format: "lastName, firstName, year" or "lastName, firstName"
  const parts = clean.split(',');
  const lastName = parts[0]?.trim() ?? '';
  // Take second part as firstName, ignore year (third part)
  const firstName = parts[1]?.trim() ?? '';
  return { firstName, lastName };
}

function parseTranslator(raw: string): string {
  // Take before $$Q, strip parenthetical suffixes like ((מתרגם))
  return raw
    .split('$$Q')[0]
    .replace(/\(\(.*?\)\)/g, '')
    .trim();
}

function parsePublisher(raw: string): string {
  // "ת"א [=תל אביב] : אופוס" → take after last " : "
  const colonIdx = raw.lastIndexOf(' : ');
  return colonIdx !== -1 ? raw.substring(colonIdx + 3).trim() : raw.trim();
}

function parseYear(raw: string): number | undefined {
  const year = parseInt(raw.substring(0, 4), 10);
  return isNaN(year) ? undefined : year;
}

function parsePages(raw: string): number | undefined {
  const match = raw.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

function parseLanguage(raw: string): string {
  const map: Record<string, string> = {
    heb: 'עברית',
    eng: 'אנגלית',
    fre: 'צרפתית',
    ger: 'גרמנית',
    rus: 'רוסית',
    ara: 'ערבית',
    spa: 'ספרדית',
  };
  return map[raw.toLowerCase()] ?? raw;
}

export async function fetchBookFromNli(isbn: string): Promise<GoogleBookData | null> {
  const apiKey = import.meta.env.VITE_SEARCH_API_KEY;
  if (!apiKey) {
    console.warn('NLI API key (VITE_SEARCH_API_KEY) is missing');
    return null;
  }

  const url = `https://api.nli.org.il/openlibrary/search?api_key=${apiKey}&query=any,exact,${isbn}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NLI API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('NLI raw response:', data);

  if (!Array.isArray(data) || data.length === 0) return null;

  const record = data[0] as Record<string, unknown>;
  console.log('NLI first record:', record);

  const result: GoogleBookData = {};

  const rawTitle = dcVal(record, 'title');
  if (rawTitle) result.title = parseTitle(rawTitle);

  const rawCreator = dcVal(record, 'creator');
  if (rawCreator) {
    const author = parseAuthor(rawCreator);
    if (author.firstName || author.lastName) result.authors = [`${author.firstName} ${author.lastName}`.trim()];
  }

  const rawContributor = dcVal(record, 'contributor');
  if (rawContributor) result.translatedBy = parseTranslator(rawContributor);

  const rawPublisher = dcVal(record, 'publisher');
  if (rawPublisher) result.publishingHouse = parsePublisher(rawPublisher);

  const rawDate = dcVal(record, 'date');
  if (rawDate) result.publishedYear = parseYear(rawDate);

  const rawFormat = dcVal(record, 'format');
  if (rawFormat) result.numberOfPages = parsePages(rawFormat);

  const rawLang = dcVal(record, 'language');
  if (rawLang) result.language = parseLanguage(rawLang);

  return result;
}
