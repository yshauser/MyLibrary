import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ActivityLogEntry, ActivityType } from '../types/activityLog';

const COLLECTION_NAME = 'activityLog';
const logRef = collection(db, COLLECTION_NAME);

export const activityLogService = {
  async logAction(
    actionType: ActivityType,
    bookTitle: string,
    bookId: string,
    performedBy: string,
    loanerName?: string
  ): Promise<void> {
    const entry: Record<string, unknown> = {
      actionType,
      actionDate: Timestamp.now(),
      bookTitle,
      bookId,
      performedBy,
    };
    if (loanerName) entry.loanerName = loanerName;
    await addDoc(logRef, entry);
  },

  async getActivityLog(): Promise<ActivityLogEntry[]> {
    const q = query(logRef, orderBy('actionDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ActivityLogEntry[];
  },

  async addManualEntry(
    actionType: ActivityType,
    actionDate: string,
    bookTitle: string,
    performedBy: string,
    loanerName?: string
  ): Promise<void> {
    const entry: Record<string, unknown> = {
      actionType,
      actionDate: Timestamp.fromDate(new Date(actionDate)),
      bookTitle,
      bookId: 'manual',
      performedBy,
    };
    if (loanerName?.trim()) entry.loanerName = loanerName.trim();
    await addDoc(logRef, entry);
  },

  async deleteEntry(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  },

  async updateEntry(id: string, data: Partial<Omit<ActivityLogEntry, 'id'>>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) clean[key] = value;
    }
    await updateDoc(docRef, clean);
  },
};
