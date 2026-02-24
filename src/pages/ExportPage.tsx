import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Alert,
} from '@mui/material';
import { FileDownload as DownloadIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { bookService } from '../services/bookService';
import type { Book } from '../types/book';

function flattenBook(book: Book) {
  return {
    'מספר מזהה': book.internalId,
    'שם הספר': book.title,
    'שם מקורי': book.originalTitle || '',
    'מחבר - שם פרטי': book.authors?.map((a) => a.firstName).join('; ') || '',
    'מחבר - שם משפחה': book.authors?.map((a) => a.lastName).join('; ') || '',
    'שפה': book.language || '',
    'שפה מקורית': book.originalLanguage || '',
    'ISBN': book.isbn || '',
    'שנת הוצאה': book.publishedYear || '',
    'מתורגם ע״י': book.translatedBy || '',
    'שנת תרגום': book.translationPublishingYear || '',
    'הוצאה לאור': book.publishingHouse || '',
    'מהדורה': book.edition || '',
    'מספר עמודים': book.numberOfPages || '',
    'שם סדרה': book.series?.name || '',
    'מספר כרך': book.series?.volumeNumber || '',
    'חלק בכרך': book.series?.volumePart || '',
    'סה״כ כרכים': book.series?.totalVolumes || '',
    'כרכים לא מתורגמים': book.series?.hasUntranslatedBooks ? 'כן' : '',
    'ז׳אנרים': book.genres?.join('; ') || '',
    'תת-ז׳אנרים': book.subGenres?.join('; ') || '',
    'הערות': book.comments || '',
    'מיקום פיזי': book.physicalLocation || '',
    'סטטוס קריאה': book.readingStatus || '',
    'דירוג': book.personalRating || '',
    'מושאל ל': book.currentLoan?.loanerName || '',
  };
}

export default function ExportPage() {
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async () => {
    setLoading(true);
    setError('');
    try {
      const books = await bookService.getAllBooks();
      const data = books.map(flattenBook);

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'ספרים');

      if (format === 'xlsx') {
        XLSX.writeFile(workbook, 'library_export.xlsx');
      } else {
        XLSX.writeFile(workbook, 'library_export.csv', { bookType: 'csv' });
      }
    } catch (err) {
      console.error('Error exporting:', err);
      setError('שגיאה בייצוא הנתונים');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        ייצוא ספרים
      </Typography>
      <Paper sx={{ p: 3, maxWidth: 500 }}>
        <Typography variant="body1" gutterBottom>
          בחר פורמט לייצוא:
        </Typography>
        <FormControl sx={{ mb: 3 }}>
          <RadioGroup value={format} onChange={(e) => setFormat(e.target.value as 'xlsx' | 'csv')}>
            <FormControlLabel value="xlsx" control={<Radio />} label="Excel (XLSX)" />
            <FormControlLabel value="csv" control={<Radio />} label="CSV" />
          </RadioGroup>
        </FormControl>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Button
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
          onClick={handleExport}
          disabled={loading}
        >
          {loading ? 'מייצא...' : 'ייצא'}
        </Button>
      </Paper>
    </Box>
  );
}
