import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Snackbar, Alert, CircularProgress } from '@mui/material';
import type { Book, BookFormData } from '../types/book';
import { bookService } from '../services/bookService';
import BookForm from '../components/books/BookForm';

export default function EditBookPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBook = async () => {
      if (!id) return;
      try {
        const bookData = await bookService.getBookById(id);
        setBook(bookData);
      } catch (err) {
        console.error('Error loading book:', err);
        setError('שגיאה בטעינת הספר');
      } finally {
        setLoading(false);
      }
    };
    loadBook();
  }, [id]);

  const handleSubmit = async (data: BookFormData) => {
    if (!id) return;
    setSaving(true);
    setError('');
    try {
      console.log('[EditBook] Updating book id:', id);
      console.log('[EditBook] Data:', JSON.stringify(data, null, 2));
      await bookService.updateBook(id, data);
      console.log('[EditBook] Update successful');
      navigate('/', { state: { message: 'הספר עודכן בהצלחה' } });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[EditBook] Error:', errorMsg);
      console.error('[EditBook] Full error:', err);
      setError(`שגיאה בעדכון: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!book) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error">הספר לא נמצא</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        עריכת ספר — {book.title}
      </Typography>
      <BookForm
        initialData={book}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/')}
        isLoading={saving}
      />
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled">{error}</Alert>
      </Snackbar>
    </Box>
  );
}
