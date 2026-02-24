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
} from '@mui/material';
import { FileUpload as UploadIcon, Save as SaveIcon, Download as DownloadIcon, Cancel as CancelIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { Timestamp } from 'firebase/firestore';
import type { BookFormData, Author } from '../types/book';
import { bookService } from '../services/bookService';

interface ParsedRow {
  internalId: string;
  title: string;
  authors: Author[];
  genres: string[];
  subGenres: string[];
  isbn?: string;
  publishedYear?: number;
  publishingHouse?: string;
  edition?: string;
  language?: string;
  originalTitle?: string;
  originalLanguage?: string;
  translatedBy?: string;
  translationPublishingYear?: number;
  numberOfPages?: number;
  seriesName?: string;
  volumeNumber?: number;
  volumePart?: number;
  totalVolumes?: number;
  hasUntranslatedBooks?: boolean;
  comments?: string;
  physicalLocation?: string;
  readingStatus?: string;
  personalRating?: number;
  valid: boolean;
  errors: string[];
}

function parseAuthors(firstNames: string, lastNames: string): Author[] {
  const fNames = firstNames ? firstNames.split(';').map((s) => s.trim()) : [''];
  const lNames = lastNames ? lastNames.split(';').map((s) => s.trim()) : [''];
  const max = Math.max(fNames.length, lNames.length);
  const authors: Author[] = [];
  for (let i = 0; i < max; i++) {
    authors.push({
      firstName: fNames[i] || '',
      lastName: lNames[i] || '',
    });
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
  const volumeNumber = row['מספר כרך'] ? Number(row['מספר כרך']) : undefined;
  const volumePart = row['חלק בכרך'] ? Number(row['חלק בכרך']) : undefined;
  const totalVolumes = row['סה״כ כרכים'] ? Number(row['סה״כ כרכים']) : undefined;
  const personalRating = row['דירוג'] ? Number(row['דירוג']) : undefined;

  return {
    internalId,
    title,
    authors,
    genres,
    subGenres,
    isbn: String(row['ISBN'] || '').trim() || undefined,
    publishedYear: publishedYear && !isNaN(publishedYear) ? publishedYear : undefined,
    publishingHouse: String(row['הוצאה לאור'] || '').trim() || undefined,
    edition: String(row['מהדורה'] || '').trim() || undefined,
    language: String(row['שפה'] || '').trim() || undefined,
    originalTitle: String(row['שם מקורי'] || '').trim() || undefined,
    originalLanguage: String(row['שפה מקורית'] || '').trim() || undefined,
    translatedBy: String(row['מתורגם ע״י'] || '').trim() || undefined,
    translationPublishingYear: translationPublishingYear && !isNaN(translationPublishingYear) ? translationPublishingYear : undefined,
    numberOfPages: numberOfPages && !isNaN(numberOfPages) ? numberOfPages : undefined,
    seriesName: String(row['שם סדרה'] || '').trim() || undefined,
    volumeNumber: volumeNumber && !isNaN(volumeNumber) ? volumeNumber : undefined,
    volumePart: volumePart && !isNaN(volumePart) ? volumePart : undefined,
    totalVolumes: totalVolumes && !isNaN(totalVolumes) ? totalVolumes : undefined,
    hasUntranslatedBooks: String(row['כרכים לא מתורגמים'] || '').trim() === 'כן',
    comments: String(row['הערות'] || '').trim() || undefined,
    physicalLocation: String(row['מיקום פיזי'] || '').trim() || undefined,
    readingStatus: String(row['סטטוס קריאה'] || '').trim() || undefined,
    personalRating: personalRating && !isNaN(personalRating) ? personalRating : undefined,
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
  if (row.publishedYear) data.publishedYear = row.publishedYear;
  if (row.publishingHouse) data.publishingHouse = row.publishingHouse;
  if (row.edition) data.edition = row.edition;
  if (row.language) data.language = row.language;
  if (row.originalTitle) data.originalTitle = row.originalTitle;
  if (row.originalLanguage) data.originalLanguage = row.originalLanguage;
  if (row.translatedBy) data.translatedBy = row.translatedBy;
  if (row.translationPublishingYear) data.translationPublishingYear = row.translationPublishingYear;
  if (row.numberOfPages) data.numberOfPages = row.numberOfPages;
  if (row.comments) data.comments = row.comments;
  if (row.physicalLocation) data.physicalLocation = row.physicalLocation;
  if (row.readingStatus) data.readingStatus = row.readingStatus as BookFormData['readingStatus'];
  if (row.personalRating) data.personalRating = row.personalRating;

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

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ added: number; updated: number; errors: number } | null>(null);
  const [error, setError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setResult(null);
    setParsedRows([]);

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

  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => r.valid);
    if (validRows.length === 0) return;

    setImporting(true);

    try {
      const booksToImport = validRows.map((row, index) => {
        const bookData = parsedRowToBookFormData(row);
        console.log(`[Import] Row ${index + 1}:`, JSON.stringify(bookData, null, 2));
        return bookData;
      });
      console.log(`[Import] Sending ${booksToImport.length} books to batchUpsertBooks`);
      const { added, updated } = await bookService.batchUpsertBooks(booksToImport);
      console.log(`[Import] Success: added=${added}, updated=${updated}`);
      setResult({ added, updated, errors: parsedRows.length - validRows.length });
      setParsedRows([]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : '';
      console.error('[Import] Error:', errorMsg);
      console.error('[Import] Stack:', errorStack);
      console.error('[Import] Full error object:', err);
      setError(`שגיאה בייבוא: ${errorMsg}`);
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.valid).length;
  const invalidCount = parsedRows.filter((r) => !r.valid).length;

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        ייבוא ספרים
      </Typography>

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
          הייבוא הושלם: {result.added > 0 && `${result.added} ספרים חדשים נוספו`}
          {result.added > 0 && result.updated > 0 && ', '}
          {result.updated > 0 && `${result.updated} ספרים עודכנו`}
          {result.errors > 0 && `, ${result.errors} שורות נדלגו בגלל שגיאות`}
        </Alert>
      )}

      {parsedRows.length > 0 && (
        <>
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
                disabled={importing}
              >
                ביטול
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleImport}
                disabled={importing || validCount === 0}
              >
                {importing ? 'מייבא...' : `ייבא ${validCount} ספרים`}
              </Button>
            </Stack>
            {importing && <LinearProgress sx={{ mt: 2 }} />}
          </Paper>

          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>סטטוס</TableCell>
                  <TableCell>מס׳ מזהה</TableCell>
                  <TableCell>שם הספר</TableCell>
                  <TableCell>מחבר</TableCell>
                  <TableCell>ז׳אנר</TableCell>
                  <TableCell>שגיאות</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parsedRows.map((row, index) => (
                  <TableRow
                    key={index}
                    sx={{ bgcolor: row.valid ? undefined : 'error.light' }}
                  >
                    <TableCell>
                      <Chip
                        label={row.valid ? '✓' : '✗'}
                        size="small"
                        color={row.valid ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>{row.internalId}</TableCell>
                    <TableCell>{row.title}</TableCell>
                    <TableCell>
                      {row.authors.map((a) => `${a.firstName} ${a.lastName}`).join(', ')}
                    </TableCell>
                    <TableCell>{row.genres.join(', ')}</TableCell>
                    <TableCell>
                      {row.errors.map((err, i) => (
                        <Typography key={i} variant="caption" color="error">
                          {err}
                        </Typography>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
