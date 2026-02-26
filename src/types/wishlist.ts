import { Timestamp } from 'firebase/firestore';

export interface WishlistItem {
  id: string;
  bookName: string;
  seriesName?: string;
  bookVolume?: string;
  author?: string;
  publishingHouse?: string;
  dateAdded: Timestamp;
}

export type WishlistFormData = Omit<WishlistItem, 'id' | 'dateAdded'>;
