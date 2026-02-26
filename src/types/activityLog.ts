import { Timestamp } from 'firebase/firestore';

export type ActivityType = 'add' | 'edit' | 'delete' | 'loan' | 'return';

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  add: 'הוספת ספר',
  edit: 'עריכת ספר',
  delete: 'מחיקת ספר',
  loan: 'השאלה',
  return: 'החזרה',
};

export interface ActivityLogEntry {
  id: string;
  actionType: ActivityType;
  actionDate: Timestamp;
  bookTitle: string;
  bookId: string;
  loanerName?: string;
  performedBy: string;
}
