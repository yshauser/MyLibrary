import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  Timestamp,
  DocumentSnapshot,
  QueryConstraint,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Book, BookFormData } from '../types/book';
import { BOOKS_PER_PAGE } from '../config/constants';

const COLLECTION_NAME = 'books';
const booksRef = collection(db, COLLECTION_NAME);

function removeUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Timestamp)) {
      clean[key] = removeUndefined(value as Record<string, unknown>);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export const bookService = {
  async getBooks(
    pageSize: number = BOOKS_PER_PAGE,
    lastDoc?: DocumentSnapshot,
    sortField: string = 'title',
    sortDirection: 'asc' | 'desc' = 'asc',
    filters?: { field: string; value: string }[]
  ): Promise<{ books: Book[]; lastDoc: DocumentSnapshot | null }> {
    const constraints: QueryConstraint[] = [];

    if (filters) {
      for (const filter of filters) {
        if (filter.field === 'genres') {
          constraints.push(where('genres', 'array-contains', filter.value));
        } else if (filter.field === 'subGenres') {
          constraints.push(where('subGenres', 'array-contains', filter.value));
        } else {
          constraints.push(where(filter.field, '==', filter.value));
        }
      }
    }

    constraints.push(orderBy(sortField, sortDirection));
    constraints.push(limit(pageSize));

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const q = query(booksRef, ...constraints);
    const snapshot = await getDocs(q);

    const books: Book[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Book[];

    const newLastDoc = snapshot.docs.length > 0
      ? snapshot.docs[snapshot.docs.length - 1]
      : null;

    return { books, lastDoc: newLastDoc };
  },

  async getAllBooks(): Promise<Book[]> {
    const q = query(booksRef, orderBy('title', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Book[];
  },

  async getBookById(id: string): Promise<Book | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Book;
  },

  async addBook(bookData: BookFormData): Promise<string> {
    const dataToSave = removeUndefined({
      ...bookData,
      dateAdded: Timestamp.now(),
    });
    const docRef = await addDoc(booksRef, dataToSave);
    return docRef.id;
  },

  async updateBook(id: string, bookData: Partial<BookFormData>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, removeUndefined(bookData as Record<string, unknown>));
  },

  async deleteBook(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  async batchAddBooks(books: BookFormData[]): Promise<number> {
    let count = 0;
    const batchSize = 500;

    for (let i = 0; i < books.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = books.slice(i, i + batchSize);

      for (const bookData of chunk) {
        const docRef = doc(booksRef);
        batch.set(docRef, removeUndefined({
          ...bookData,
          dateAdded: bookData.dateAdded || Timestamp.now(),
        }) as Record<string, unknown>);
        count++;
      }

      await batch.commit();
    }

    return count;
  },

  async findBooksByInternalIds(internalIds: string[]): Promise<Map<string, string>> {
    console.log('[BookService] findBooksByInternalIds: looking for', internalIds);
    const map = new Map<string, string>();
    const snapshot = await getDocs(booksRef);
    console.log(`[BookService] Found ${snapshot.docs.length} existing books in DB`);
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data.internalId && internalIds.includes(data.internalId)) {
        map.set(data.internalId, docSnap.id);
      }
    }
    console.log(`[BookService] Matched ${map.size} existing internalIds:`, [...map.entries()]);
    return map;
  },

  async batchUpsertBooks(books: BookFormData[]): Promise<{ added: number; updated: number }> {
    console.log(`[BookService] batchUpsertBooks called with ${books.length} books`);
    const internalIds = books
      .map((b) => b.internalId)
      .filter((id): id is string => !!id);
    console.log(`[BookService] Found ${internalIds.length} books with internalIds`);

    const existingMap = internalIds.length > 0
      ? await this.findBooksByInternalIds(internalIds)
      : new Map<string, string>();

    let added = 0;
    let updated = 0;
    const batchSize = 500;

    for (let i = 0; i < books.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = books.slice(i, i + batchSize);
      console.log(`[BookService] Processing batch ${Math.floor(i / batchSize) + 1}, chunk size: ${chunk.length}`);

      for (const bookData of chunk) {
        const existingDocId = bookData.internalId
          ? existingMap.get(bookData.internalId)
          : undefined;

        if (existingDocId) {
          console.log(`[BookService] UPDATE: "${bookData.title}" (internalId=${bookData.internalId}, docId=${existingDocId})`);
          const docRef = doc(db, COLLECTION_NAME, existingDocId);
          batch.set(docRef, removeUndefined({
            ...bookData,
            dateAdded: bookData.dateAdded || Timestamp.now(),
          }) as Record<string, unknown>, { merge: false });
          updated++;
        } else {
          console.log(`[BookService] ADD: "${bookData.title}" (internalId=${bookData.internalId || 'none'})`);
          const docRef = doc(booksRef);
          batch.set(docRef, removeUndefined({
            ...bookData,
            dateAdded: bookData.dateAdded || Timestamp.now(),
          }) as Record<string, unknown>);
          added++;
        }
      }

      console.log(`[BookService] Committing batch...`);
      await batch.commit();
      console.log(`[BookService] Batch committed successfully`);
    }

    console.log(`[BookService] Done: added=${added}, updated=${updated}`);
    return { added, updated };
  },
};
