import {
  collection,
  addDoc,
  getDocs,
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
};
