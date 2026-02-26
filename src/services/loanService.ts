import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { LoanRecord } from '../types/book';
import { activityLogService } from './activityLogService';

const COLLECTION_NAME = 'books';

export const loanService = {
  async loanBook(bookId: string, loanerName: string, loanDate?: Date, bookTitle?: string, performedBy?: string): Promise<string> {
    const loanRef = collection(db, COLLECTION_NAME, bookId, 'loanHistory');
    const bookRef = doc(db, COLLECTION_NAME, bookId);

    const loanTimestamp = loanDate ? Timestamp.fromDate(loanDate) : Timestamp.now();

    const loanData = {
      loanerName,
      loanDate: loanTimestamp,
    };

    const loanDoc = await addDoc(loanRef, loanData);

    await updateDoc(bookRef, {
      currentLoan: {
        loanerName,
        loanDate: loanTimestamp,
      },
    });

    if (performedBy && bookTitle) {
      activityLogService.logAction('loan', bookTitle, bookId, performedBy, loanerName).catch(() => {});
    }

    return loanDoc.id;
  },

  async returnBook(bookId: string, loanId: string, returnDate?: Date, bookTitle?: string, loanerName?: string, performedBy?: string): Promise<void> {
    const loanDocRef = doc(db, COLLECTION_NAME, bookId, 'loanHistory', loanId);
    const bookRef = doc(db, COLLECTION_NAME, bookId);

    const returnTimestamp = returnDate ? Timestamp.fromDate(returnDate) : Timestamp.now();

    await updateDoc(loanDocRef, {
      returnDate: returnTimestamp,
    });

    await updateDoc(bookRef, {
      currentLoan: null,
    });

    if (performedBy && bookTitle) {
      activityLogService.logAction('return', bookTitle, bookId, performedBy, loanerName).catch(() => {});
    }
  },

  async getLoanHistory(bookId: string): Promise<LoanRecord[]> {
    const loanRef = collection(db, COLLECTION_NAME, bookId, 'loanHistory');
    const q = query(loanRef, orderBy('loanDate', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as LoanRecord[];
  },
};
