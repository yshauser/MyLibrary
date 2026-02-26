import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { WishlistItem, WishlistFormData } from '../types/wishlist';

const COLLECTION_NAME = 'wishlist';
const wishlistRef = collection(db, COLLECTION_NAME);

function removeUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) clean[key] = value;
  }
  return clean;
}

export const wishlistService = {
  async getAll(): Promise<WishlistItem[]> {
    const q = query(wishlistRef, orderBy('dateAdded', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as WishlistItem[];
  },

  async add(data: WishlistFormData): Promise<string> {
    const docRef = await addDoc(wishlistRef, removeUndefined({
      ...data,
      dateAdded: Timestamp.now(),
    } as Record<string, unknown>));
    return docRef.id;
  },

  async update(id: string, data: Partial<WishlistFormData>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, removeUndefined(data as Record<string, unknown>));
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },
};
