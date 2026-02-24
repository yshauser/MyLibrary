import { Timestamp } from 'firebase/firestore';

export interface Author {
  firstName: string;
  lastName: string;
}

export interface Series {
  name: string;
  volumeNumber?: number;
  volumePart?: number;
  totalVolumes?: number;
  hasUntranslatedBooks?: boolean;
}

export interface LoanRecord {
  id: string;
  loanerName: string;
  loanDate: Timestamp;
  returnDate?: Timestamp;
  notes?: string;
}

export interface CurrentLoan {
  loanerName: string;
  loanDate: Timestamp;
}

export type ReadingStatus = 'unread' | 'reading' | 'read' | '-/-';

export interface Book {
  id: string;
  internalId: string;
  title: string;
  originalTitle?: string;
  authors: Author[];
  language?: string;
  originalLanguage?: string;
  isbn?: string;
  publishedYear?: number;
  translatedBy?: string;
  translationPublishingYear?: number;
  publishingHouse?: string;
  edition?: string;
  numberOfPages?: number;
  coverImageUrl?: string;
  series?: Series;
  genres: string[];
  subGenres: string[];
  comments?: string;
  physicalLocation?: string;
  readingStatus?: ReadingStatus;
  personalRating?: number;
  dateAdded: Timestamp;
  currentLoan?: CurrentLoan | null;
}

export type BookFormData = Omit<Book, 'id' | 'dateAdded'> & {
  dateAdded?: Timestamp;
};
