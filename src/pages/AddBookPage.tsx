import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Snackbar, Alert, CircularProgress } from '@mui/material';
import type { BookFormData } from '../types/book';
import { bookService } from '../services/bookService';
import BookForm from '../components/books/BookForm';

export default function AddBookPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nextId, setNextId] = useState<string | null>(null);

  useEffect(() => {
    bookService.getAllBooks().then((books) => {
      const maxId = books.reduce((max, b) => {
        const n = parseInt(b.internalId || '0', 10);
        return isNaN(n) ? max : Math.max(max, n);
      }, 0);
      setNextId(String(maxId + 1));
    }).catch(() => setNextId('1'));
  }, []);

  const handleSubmit = async (data: BookFormData) => {
    setLoading(true);
    setError('');
    try {
      await bookService.addBook(data);
      navigate('/', { state: { message: 'הספר נוסף בהצלחה' } });
    } catch (err) {
      console.error('Error adding book:', err);
      setError('שגיאה בהוספת הספר');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        הוספת ספר חדש
      </Typography>
      {nextId === null ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <BookForm
          initialData={{ internalId: nextId } as never}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/')}
          isLoading={loading}
        />
      )}
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
