import { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  LinearProgress,
  Chip,
  Stack,
  Collapse,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  FileUpload as UploadIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
  Cancel as CancelIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { Timestamp } from 'firebase/firestore';
import type { Book, BookFormData, Author } from '../types/book';
import { bookService } from '../services/bookService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedRow {
  internalId: string;
  title: string;
  authors: Author[];
  genres: string[];
  subGenres: string[];
  isbn?: string;
  danacode?: string;
  publishedYear?: number;
  publishingHouse?: string;
  edition?: string;
  language?: string;
  originalTitle?: string;
  originalLanguage?: string;
  translatedBy?: string;
  translationPublishingYear?: number;
  numberOfPages?: number;
  weight?: number;
  coverImageUrl?: string;
  seriesName?: string;
  volumeNumber?: number;
  volumePart?: string;
  totalVolumes?: number;
  hasUntranslatedBooks?: boolean;
  comments?: string;
  physicalLocation?: string;
  readingStatus?: string;
  personalRating?: number;
  valid: boolean;
  errors: string[];
}

type RowStatus = 'new' | 'changed' | 'unchanged';

interface ComparedRow {
  parsed: ParsedRow;
  status: RowStatus;
  changedFields: string[];
  existingBook?: Book;
  selected: boolean;
}

// ─── Field label map (for human-readable diff display) ───────────────────────

const FIELD_LABELS: Record<string, string> = {
  title: 'שם הספר',
  originalTitle: 'שם מקורי',
  authors: 'מחברים',
  language: 'שפה',
  originalLanguage: 'שפה מקורית',
  isbn: 'ISBN',
  danacode: 'דאנאקוד',
  publishedYear: 'שנת הוצאה',
  translatedBy: 'תורגם ע״י',
  translationPublishingYear: 'שנת תרגום',
  publishingHouse: 'הוצאה לאור',
  edition: 'מהדורה',
  numberOfPages: 'מספר עמודים',
  weight: 'משקל',
  coverImageUrl: 'תמונת כריכה',
  genres: 'ז׳אנרים',
  subGenres: 'תת-ז׳אנרים',
  comments: 'הערות',
  physicalLocation: 'מיקום פיזי',
  readingStatus: 'סטטוס קריאה',
  personalRating: 'דירוג',
  series: 'סדרה',
};

// ─── Parse helpers ────────────────────────────────────────────────────────────

function parseAuthors(firstNames: string, lastNames: string): Author[] {
  const fNames = firstNames ? firstNames.split(';').map((s) => s.trim()) : [''];
  const lNames = lastNames ? lastNames.split(';').map((s) => s.trim()) : [''];
  const max = Math.max(fNames.length, lNames.length);
  const authors: Author[] = [];
  for (let i = 0; i < max; i++) {
    authors.push({ firstName: fNames[i] || '', lastName: lNames[i] || '' });
  }
  return authors;
}

function parseRow(row: Record<string, unknown>): ParsedRow {
  const errors: string[] = [];
  const internalId = String(row['מספר מזהה'] || '').trim();
  const title = String(row['שם הספר'] || '').trim();

  if (!title) errors.push('חסר שם ספר');

  const authors = parseAuthors(
    String(row['מחבר - שם פרטי'] || ''),
    String(row['מחבר - שם משפחה'] || '')
  );
  const genres = row['ז׳אנרים']
    ? String(row['ז׳אנרים']).split(';').map((s) => s.trim()).filter(Boolean)
    : [];
  const subGenres = row['תת-ז׳אנרים']
    ? String(row['תת-ז׳אנרים']).split(';').map((s) => s.trim()).filter(Boolean)
    : [];

  const publishedYear = row['שנת הוצאה'] ? Number(row['שנת הוצאה']) : undefined;
  const translationPublishingYear = row['שנת תרגום'] ? Number(row['שנת תרגום']) : undefined;
  const numberOfPages = row['מספר עמודים'] ? Number(row['מספר עמודים']) : undefined;
  const weight = row['משקל'] ? Number(row['משקל']) : undefined;
  const volumeNumber = row['מספר כרך'] ? Number(row['מספר כרך']) : undefined;
  const volumePart = String(row['חלק בכרך'] || '').trim() || undefined;
  const totalVolumes = row['סה״כ כרכים'] ? Number(row['סה״כ כרכים']) : undefined;
  const personalRating = row['דירוג'] ? Number(row['דירוג']) : undefined;

  return {
    internalId,
    title,
    authors,
    genres,
    subGenres,
    isbn: String(row['ISBN'] || '').trim() || undefined,
    danacode: String(row['דאנאקוד'] || '').trim() || undefined,
    publishedYear: publishedYear && !isNaN(publishedYear) ? publishedYear : undefined,
    publishingHouse: String(row['הוצאה לאור'] || '').trim() || undefined,
    edition: String(row['מהדורה'] || '').trim() || undefined,
    language: String(row['שפה'] || '').trim() || undefined,
    originalTitle: String(row['שם מקורי'] || '').trim() || undefined,
    originalLanguage: String(row['שפה מקורית'] || '').trim() || undefined,
    translatedBy: String(row['תורגם ע״י'] || '').trim() || undefined,
    translationPublishingYear: translationPublishingYear && !isNaN(translationPublishingYear) ? translationPublishingYear : undefined,
    numberOfPages: numberOfPages && !isNaN(numberOfPages) ? numberOfPages : undefined,
    weight: weight && !isNaN(weight) ? weight : undefined,
    seriesName: String(row['שם סדרה'] || '').trim() || undefined,
    volumeNumber: volumeNumber && !isNaN(volumeNumber) ? volumeNumber : undefined,
    volumePart,
    totalVolumes: totalVolumes && !isNaN(totalVolumes) ? totalVolumes : undefined,
    hasUntranslatedBooks: String(row['כרכים לא מתורגמים'] || '').trim() === 'כן',
    comments: String(row['הערות'] || '').trim() || undefined,
    physicalLocation: String(row['מיקום פיזי'] || '').trim() || undefined,
    readingStatus: String(row['סטטוס קריאה'] || '').trim() || undefined,
    personalRating: personalRating && !isNaN(personalRating) ? personalRating : undefined,
    coverImageUrl: String(row['תמונת כריכה'] || '').trim() || undefined,
    valid: errors.length === 0,
    errors,
  };
}

function parsedRowToBookFormData(row: ParsedRow): BookFormData {
  const data: BookFormData = {
    internalId: row.internalId,
    title: row.title,
    authors: row.authors,
    genres: row.genres,
    subGenres: row.subGenres,
    dateAdded: Timestamp.now(),
    currentLoan: null,
  };

  if (row.isbn) data.isbn = row.isbn;
  if (row.danacode) data.danacode = row.danacode;
  if (row.publishedYear) data.publishedYear = row.publishedYear;
  if (row.publishingHouse) data.publishingHouse = row.publishingHouse;
  if (row.edition) data.edition = row.edition;
  if (row.language) data.language = row.language;
  if (row.originalTitle) data.originalTitle = row.originalTitle;
  if (row.originalLanguage) data.originalLanguage = row.originalLanguage;
  if (row.translatedBy) data.translatedBy = row.translatedBy;
  if (row.translationPublishingYear) data.translationPublishingYear = row.translationPublishingYear;
  if (row.numberOfPages) data.numberOfPages = row.numberOfPages;
  if (row.weight) data.weight = row.weight;
  if (row.comments) data.comments = row.comments;
  if (row.physicalLocation) data.physicalLocation = row.physicalLocation;
  if (row.readingStatus) data.readingStatus = row.readingStatus as BookFormData['readingStatus'];
  if (row.personalRating) data.personalRating = row.personalRating;
  if (row.coverImageUrl) data.coverImageUrl = row.coverImageUrl;

  if (row.seriesName) {
    const series: Record<string, unknown> = { name: row.seriesName };
    if (row.volumeNumber != null) series.volumeNumber = row.volumeNumber;
    if (row.volumePart != null) series.volumePart = row.volumePart;
    if (row.totalVolumes != null) series.totalVolumes = row.totalVolumes;
    if (row.hasUntranslatedBooks != null) series.hasUntranslatedBooks = row.hasUntranslatedBooks;
    data.series = series as unknown as BookFormData['series'];
  }

  return data;
}

// ─── Diff logic ───────────────────────────────────────────────────────────────

function authorsEqual(a: Author[], b: Author[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((ai, i) => ai.firstName === b[i].firstName && ai.lastName === b[i].lastName);
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

function findChangedFields(parsed: ParsedRow, existing: Book): string[] {
  const changed: string[] = [];

  const strChanged = (a: string | undefined, b: string | undefined) =>
    (a || '') !== (b || '');
  const numChanged = (a: number | undefined, b: number | undefined) =>
    (a ?? '') !== (b ?? '');

  if (strChanged(parsed.title, existing.title)) changed.push('title');
  if (strChanged(parsed.originalTitle, existing.originalTitle)) changed.push('originalTitle');
  if (!authorsEqual(parsed.authors, existing.authors ?? [])) changed.push('authors');
  if (strChanged(parsed.language, existing.language)) changed.push('language');
  if (strChanged(parsed.originalLanguage, existing.originalLanguage)) changed.push('originalLanguage');
  if (strChanged(parsed.isbn, existing.isbn)) changed.push('isbn');
  if (strChanged(parsed.danacode, existing.danacode)) changed.push('danacode');
  if (numChanged(parsed.publishedYear, existing.publishedYear)) changed.push('publishedYear');
  if (strChanged(parsed.translatedBy, existing.translatedBy)) changed.push('translatedBy');
  if (numChanged(parsed.translationPublishingYear, existing.translationPublishingYear)) changed.push('translationPublishingYear');
  if (strChanged(parsed.publishingHouse, existing.publishingHouse)) changed.push('publishingHouse');
  if (strChanged(parsed.edition, existing.edition)) changed.push('edition');
  if (numChanged(parsed.numberOfPages, existing.numberOfPages)) changed.push('numberOfPages');
  if (numChanged(parsed.weight, existing.weight)) changed.push('weight');
  if (strChanged(parsed.coverImageUrl, existing.coverImageUrl)) changed.push('coverImageUrl');
  if (!arraysEqual(parsed.genres, existing.genres ?? [])) changed.push('genres');
  if (!arraysEqual(parsed.subGenres, existing.subGenres ?? [])) changed.push('subGenres');
  if (strChanged(parsed.comments, existing.comments)) changed.push('comments');
  if (strChanged(parsed.physicalLocation, existing.physicalLocation)) changed.push('physicalLocation');
  if (strChanged(parsed.readingStatus, existing.readingStatus)) changed.push('readingStatus');
  if (numChanged(parsed.personalRating, existing.personalRating)) changed.push('personalRating');

  // Series comparison
  const parsedSeriesName = parsed.seriesName || '';
  const existingSeriesName = existing.series?.name || '';
  if (
    parsedSeriesName !== existingSeriesName ||
    (parsed.volumeNumber ?? '') !== (existing.series?.volumeNumber ?? '') ||
    (parsed.volumePart || '') !== (existing.series?.volumePart || '') ||
    (parsed.totalVolumes ?? '') !== (existing.series?.totalVolumes ?? '') ||
    (parsed.hasUntranslatedBooks ?? false) !== (existing.series?.hasUntranslatedBooks ?? false)
  ) {
    changed.push('series');
  }

  return changed;
}

// ─── Expanded diff row component ──────────────────────────────────────────────

function formatValue(field: string, parsed: ParsedRow, existing?: Book): { from: string; to: string } {
  switch (field) {
    case 'authors':
      return {
        from: (existing?.authors ?? []).map((a) => `${a.firstName} ${a.lastName}`).join('; '),
        to: parsed.authors.map((a) => `${a.firstName} ${a.lastName}`).join('; '),
      };
    case 'genres':
      return {
        from: (existing?.genres ?? []).join('; '),
        to: parsed.genres.join('; '),
      };
    case 'subGenres':
      return {
        from: (existing?.subGenres ?? []).join('; '),
        to: parsed.subGenres.join('; '),
      };
    case 'series':
      return {
        from: existing?.series
          ? `${existing.series.name}${existing.series.volumeNumber ? ` כרך ${existing.series.volumeNumber}` : ''}`
          : '',
        to: parsed.seriesName
          ? `${parsed.seriesName}${parsed.volumeNumber ? ` כרך ${parsed.volumeNumber}` : ''}`
          : '',
      };
    default: {
      const parsedVal = (parsed as unknown as Record<string, unknown>)[field];
      const existingVal = existing ? (existing as unknown as Record<string, unknown>)[field] : undefined;
      return {
        from: existingVal != null ? String(existingVal) : '',
        to: parsedVal != null ? String(parsedVal) : '',
      };
    }
  }
}

function DiffDetails({ row }: { row: ComparedRow }) {
  if (row.status === 'new') {
    return (
      <Box sx={{ px: 2, pb: 1 }}>
        <Chip label="ספר חדש — ייווסף למערכת" size="small" color="success" />
      </Box>
    );
  }
  if (row.status === 'unchanged') {
    return (
      <Box sx={{ px: 2, pb: 1 }}>
        <Chip label="אין שינויים" size="small" variant="outlined" />
      </Box>
    );
  }
  return (
    <Box sx={{ px: 2, pb: 1 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, width: '20%' }}>שדה</TableCell>
            <TableCell sx={{ fontWeight: 600, width: '40%', color: 'error.main' }}>ערך קיים</TableCell>
            <TableCell sx={{ fontWeight: 600, width: '40%', color: 'success.main' }}>ערך חדש</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {row.changedFields.map((field) => {
            const { from, to } = formatValue(field, row.parsed, row.existingBook);
            return (
              <TableRow key={field}>
                <TableCell>{FIELD_LABELS[field] ?? field}</TableCell>
                <TableCell sx={{ color: 'error.dark', textDecoration: 'line-through', opacity: 0.7 }}>
                  {from || '—'}
                </TableCell>
                <TableCell sx={{ color: 'success.dark', fontWeight: 500 }}>
                  {to || '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ConfirmDialog {
  open: boolean;
  onlySelected: boolean;
  addCount: number;
  updateCount: number;
}

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [comparedRows, setComparedRows] = useState<ComparedRow[]>([]);
  const [comparing, setComparing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState<RowStatus | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({ open: false, onlySelected: false, addCount: 0, updateCount: 0 });
  const [result, setResult] = useState<{ added: number; updated: number; errors: number } | null>(null);
  const [error, setError] = useState('');

  // Step 1: parse file (no DB call yet)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setResult(null);
    setParsedRows([]);
    setComparedRows([]);
    setExpandedRows(new Set());
    setStatusFilter(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
        const parsed = jsonData.map(parseRow);
        setParsedRows(parsed);
      } catch (err) {
        console.error('Error parsing file:', err);
        setError('שגיאה בקריאת הקובץ. ודא שהקובץ בפורמט Excel או CSV תקין.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Step 2: compare against DB
  const handleCompare = async () => {
    const validRows = parsedRows.filter((r) => r.valid);
    if (validRows.length === 0) return;

    setComparing(true);
    setError('');
    try {
      const internalIds = validRows
        .map((r) => r.internalId)
        .filter((id): id is string => !!id);

      const existingMap = internalIds.length > 0
        ? await bookService.findBooksByInternalIdsWithData(internalIds)
        : new Map<string, Book>();

      const compared: ComparedRow[] = parsedRows.map((parsed) => {
        if (!parsed.valid) {
          return { parsed, status: 'new', changedFields: [], selected: false };
        }
        const existing = parsed.internalId ? existingMap.get(parsed.internalId) : undefined;
        if (!existing) {
          return { parsed, status: 'new', changedFields: [], existingBook: undefined, selected: true };
        }
        const changedFields = findChangedFields(parsed, existing);
        const status: RowStatus = changedFields.length > 0 ? 'changed' : 'unchanged';
        return { parsed, status, changedFields, existingBook: existing, selected: status === 'changed' };
      });

      setComparedRows(compared);
    } catch (err) {
      console.error('Compare error:', err);
      setError('שגיאה בהשוואה לנתונים הקיימים');
    } finally {
      setComparing(false);
    }
  };

  // Step 3a: show confirmation dialog
  const requestImport = (onlySelected: boolean) => {
    const rowsToImport = comparedRows.filter((r) =>
      r.parsed.valid && (onlySelected ? r.selected : r.status !== 'unchanged')
    );
    if (rowsToImport.length === 0) return;
    const addCount = rowsToImport.filter((r) => r.status === 'new').length;
    const updateCount = rowsToImport.filter((r) => r.status === 'changed').length;
    setConfirmDialog({ open: true, onlySelected, addCount, updateCount });
  };

  // Step 3b: confirmed — actually import
  const confirmImport = async () => {
    const { onlySelected } = confirmDialog;
    setConfirmDialog((prev) => ({ ...prev, open: false }));

    const rowsToImport = comparedRows.filter((r) =>
      r.parsed.valid && (onlySelected ? r.selected : r.status !== 'unchanged')
    );
    if (rowsToImport.length === 0) return;

    setImporting(true);
    try {
      const booksToImport = rowsToImport.map((r) => parsedRowToBookFormData(r.parsed));
      const { added, updated } = await bookService.batchUpsertBooks(booksToImport);
      setResult({ added, updated, errors: parsedRows.filter((r) => !r.valid).length });
      setParsedRows([]);
      setComparedRows([]);
      setExpandedRows(new Set());
      setStatusFilter(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`שגיאה בייבוא: ${errorMsg}`);
    } finally {
      setImporting(false);
    }
  };

  const toggleStatusFilter = (status: RowStatus) => {
    setStatusFilter((prev) => (prev === status ? null : status));
  };

  const toggleRowExpanded = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleRowSelected = (index: number) => {
    setComparedRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r))
    );
  };

  const validCount = parsedRows.filter((r) => r.valid).length;
  const invalidCount = parsedRows.filter((r) => !r.valid).length;

  const newCount = comparedRows.filter((r) => r.status === 'new' && r.parsed.valid).length;
  const changedCount = comparedRows.filter((r) => r.status === 'changed').length;
  const unchangedCount = comparedRows.filter((r) => r.status === 'unchanged').length;
  const selectedCount = comparedRows.filter((r) => r.selected && r.parsed.valid).length;

  const visibleRows = statusFilter
    ? comparedRows.filter((r) => r.status === statusFilter)
    : comparedRows;

  const statusChip = (status: RowStatus) => {
    if (status === 'new') return <Chip label="חדש" size="small" color="success" />;
    if (status === 'changed') return <Chip label="שונה" size="small" color="warning" />;
    return <Chip label="ללא שינוי" size="small" variant="outlined" />;
  };

  const rowBgColor = (row: ComparedRow) => {
    if (!row.parsed.valid) return 'error.light';
    if (row.status === 'new') return 'success.50';
    if (row.status === 'changed') return 'warning.50';
    return undefined;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        ייבוא ספרים
      </Typography>

      {/* ── Upload panel ── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" gutterBottom>
          העלה קובץ Excel או CSV עם נתוני הספרים. הקובץ צריך לכלול עמודות בפורמט הייצוא.
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          עמודה נדרשת: שם הספר. שאר העמודות אופציונליות.
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          שורה עם מספר מזהה קיים במערכת — תעדכן את הרשומה הקיימת. שורה ללא מזהה או עם מזהה חדש — תיווסף כרשומה חדשה.
        </Typography>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
          >
            בחר קובץ
          </Button>
          <Button
            variant="text"
            startIcon={<DownloadIcon />}
            component="a"
            href="/import-example.xlsx"
            download="import-example.xlsx"
          >
            הורד קובץ לדוגמה
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {result && (
        <Alert severity="success" sx={{ mb: 2 }}>
          הייבוא הושלם:{' '}
          {result.added > 0 && `${result.added} ספרים חדשים נוספו`}
          {result.added > 0 && result.updated > 0 && ', '}
          {result.updated > 0 && `${result.updated} ספרים עודכנו`}
          {result.errors > 0 && `, ${result.errors} שורות נדלגו בגלל שגיאות`}
        </Alert>
      )}

      {/* ── Step 1: File parsed — show summary & Compare button ── */}
      {parsedRows.length > 0 && comparedRows.length === 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip label={`${validCount} תקינים`} color="success" />
            {invalidCount > 0 && <Chip label={`${invalidCount} שגויים`} color="error" />}
            <Typography variant="body2" color="text.secondary">
              סה״כ {parsedRows.length} שורות
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<CancelIcon />}
              onClick={() => { setParsedRows([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              disabled={comparing}
            >
              ביטול
            </Button>
            <Button
              variant="contained"
              onClick={handleCompare}
              disabled={comparing || validCount === 0}
            >
              {comparing ? 'משווה...' : 'השווה לנתונים הקיימים'}
            </Button>
          </Stack>
          {comparing && <LinearProgress sx={{ mt: 2 }} />}

          {/* Basic validation table */}
          <TableContainer sx={{ mt: 2, maxHeight: 300 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>סטטוס</TableCell>
                  <TableCell>מס׳ מזהה</TableCell>
                  <TableCell>שם הספר</TableCell>
                  <TableCell>מחבר</TableCell>
                  <TableCell>שגיאות</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parsedRows.map((row, index) => (
                  <TableRow key={index} sx={{ bgcolor: row.valid ? undefined : 'error.light' }}>
                    <TableCell>
                      <Chip label={row.valid ? '✓' : '✗'} size="small" color={row.valid ? 'success' : 'error'} />
                    </TableCell>
                    <TableCell>{row.internalId}</TableCell>
                    <TableCell>{row.title}</TableCell>
                    <TableCell>{row.authors.map((a) => `${a.firstName} ${a.lastName}`).join(', ')}</TableCell>
                    <TableCell>
                      {row.errors.map((err, i) => (
                        <Typography key={i} variant="caption" color="error">{err}</Typography>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ── Step 2: Compared results ── */}
      {comparedRows.length > 0 && (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            {/* Summary chips — clickable to filter */}
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                סנן:
              </Typography>
              {newCount > 0 && (
                <Tooltip title={statusFilter === 'new' ? 'הצג הכל' : 'הצג רק חדשים'}>
                  <Chip
                    label={`${newCount} חדשים`}
                    color="success"
                    onClick={() => toggleStatusFilter('new')}
                    variant={statusFilter === 'new' ? 'filled' : 'outlined'}
                    sx={{ cursor: 'pointer', fontWeight: statusFilter === 'new' ? 700 : 400 }}
                  />
                </Tooltip>
              )}
              {changedCount > 0 && (
                <Tooltip title={statusFilter === 'changed' ? 'הצג הכל' : 'הצג רק שונים'}>
                  <Chip
                    label={`${changedCount} שונו`}
                    color="warning"
                    onClick={() => toggleStatusFilter('changed')}
                    variant={statusFilter === 'changed' ? 'filled' : 'outlined'}
                    sx={{ cursor: 'pointer', fontWeight: statusFilter === 'changed' ? 700 : 400 }}
                  />
                </Tooltip>
              )}
              {unchangedCount > 0 && (
                <Tooltip title={statusFilter === 'unchanged' ? 'הצג הכל' : 'הצג רק ללא שינוי'}>
                  <Chip
                    label={`${unchangedCount} ללא שינוי`}
                    onClick={() => toggleStatusFilter('unchanged')}
                    variant={statusFilter === 'unchanged' ? 'filled' : 'outlined'}
                    sx={{ cursor: 'pointer', fontWeight: statusFilter === 'unchanged' ? 700 : 400 }}
                  />
                </Tooltip>
              )}
              {invalidCount > 0 && <Chip label={`${invalidCount} שגויים`} color="error" />}
              {statusFilter && (
                <Button size="small" onClick={() => setStatusFilter(null)} sx={{ ml: 1 }}>
                  הצג הכל
                </Button>
              )}
            </Stack>

            {/* Action buttons */}
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<CancelIcon />}
                onClick={() => {
                  setParsedRows([]);
                  setComparedRows([]);
                  setExpandedRows(new Set());
                  setStatusFilter(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={importing}
              >
                ביטול
              </Button>
              <Tooltip title={`ייבא רק את ${selectedCount} הרשומות המסומנות`}>
                <span>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={() => requestImport(true)}
                    disabled={importing || selectedCount === 0}
                  >
                    {importing ? 'מייבא...' : `ייבא מסומנים (${selectedCount})`}
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="ייבא את כל החדשים והשונים (ללא הספרים ללא שינוי)">
                <span>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={() => requestImport(false)}
                    disabled={importing || (newCount + changedCount === 0)}
                  >
                    {importing ? 'מייבא...' : `ייבא הכל (${newCount + changedCount})`}
                  </Button>
                </span>
              </Tooltip>
            </Stack>
            {importing && <LinearProgress sx={{ mt: 2 }} />}
          </Paper>

          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40 }} />
                  <TableCell sx={{ width: 80 }}>סטטוס</TableCell>
                  <TableCell sx={{ width: 60 }}>בחר</TableCell>
                  <TableCell>מס׳ מזהה</TableCell>
                  <TableCell>שם הספר</TableCell>
                  <TableCell>מחבר</TableCell>
                  <TableCell>שדות שונו</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleRows.map((row) => {
                  const index = comparedRows.indexOf(row);
                  return (
                    <>
                      <TableRow
                        key={index}
                        sx={{ bgcolor: rowBgColor(row), cursor: 'pointer' }}
                        onClick={() => toggleRowExpanded(index)}
                      >
                        <TableCell padding="none" sx={{ pl: 1 }}>
                          <IconButton size="small">
                            {expandedRows.has(index) ? <CollapseIcon /> : <ExpandIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>{row.parsed.valid ? statusChip(row.status) : <Chip label="שגיאה" size="small" color="error" />}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {row.parsed.valid && row.status !== 'unchanged' && (
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={() => toggleRowSelected(index)}
                              style={{ width: 18, height: 18, cursor: 'pointer' }}
                            />
                          )}
                        </TableCell>
                        <TableCell>{row.parsed.internalId}</TableCell>
                        <TableCell>{row.parsed.title}</TableCell>
                        <TableCell>
                          {row.parsed.authors.map((a) => `${a.firstName} ${a.lastName}`).join(', ')}
                        </TableCell>
                        <TableCell>
                          {row.status === 'changed' && (
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {row.changedFields.map((f) => (
                                <Chip key={f} label={FIELD_LABELS[f] ?? f} size="small" variant="outlined" color="warning" />
                              ))}
                            </Box>
                          )}
                          {!row.parsed.valid && (
                            <Typography variant="caption" color="error">
                              {row.parsed.errors.join(', ')}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow key={`${index}-detail`}>
                        <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                          <Collapse in={expandedRows.has(index)} timeout="auto" unmountOnExit>
                            <DiffDetails row={row} />
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* ── Confirmation dialog ── */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))} maxWidth="xs" fullWidth>
        <DialogTitle>אישור ייבוא</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.addCount > 0 && (
              <Box component="span" display="block">
                ספרים חדשים שיווספו: <strong>{confirmDialog.addCount}</strong>
              </Box>
            )}
            {confirmDialog.updateCount > 0 && (
              <Box component="span" display="block">
                ספרים קיימים שיעודכנו: <strong>{confirmDialog.updateCount}</strong>
              </Box>
            )}
            <Box component="span" display="block" sx={{ mt: 1 }}>
              האם להמשיך?
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}>ביטול</Button>
          <Button variant="contained" onClick={confirmImport}>
            אישור
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
