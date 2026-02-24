export const GENRES = [
  'מדע בדיוני',
  'פנטזיה',
  'מותחן',
  'רומן',
  'פוסט-אפוקליפטי',
  'ילדים',
  'יהדות',
  'מסתורין',
  'רומנטיקה',
  'היסטורי',
  'ביוגרפיה',
  'קומיקס',
  'עיון ופנאי',
] as const;

export const SUB_GENRES = [
  'נוער',
  'אימה',
] as const;

export const READING_STATUSES = {
  unread: 'לא נקרא',
  reading: 'בקריאה',
  read: 'נקרא',
  '-/-': '-/-',
} as const;

export const BOOKS_PER_PAGE = 50;
