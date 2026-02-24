import { useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress, Typography, Snackbar, Alert } from '@mui/material';
import type { Book } from '../types/book';
import { bookService } from '../services/bookService';
import BookTable from '../components/books/BookTable';
import DeleteConfirmDialog from '../components/books/DeleteConfirmDialog';
import LoanDialog from '../components/books/LoanDialog';
import { useAuth } from '../contexts/AuthContext';

export default function LibraryPage() {
  const { isAdmin } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteBook, setDeleteBook] = useState<Book | null>(null);
  const [loanBook, setLoanBook] = useState<Book | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadBooks = useCallback(async () => {
    try {
      const allBooks = await bookService.getAllBooks();
      setBooks(allBooks);
    } catch (error) {
      console.error('Error loading books:', error);
      setSnackbar({ open: true, message: 'שגיאה בטעינת הספרים', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleDelete = async () => {
    if (!deleteBook) return;
    setDeleteLoading(true);
    try {
      await bookService.deleteBook(deleteBook.id);
      setBooks((prev) => prev.filter((b) => b.id !== deleteBook.id));
      setSnackbar({ open: true, message: 'הספר נמחק בהצלחה', severity: 'success' });
    } catch (error) {
      console.error('Error deleting book:', error);
      setSnackbar({ open: true, message: 'שגיאה במחיקת הספר', severity: 'error' });
    } finally {
      setDeleteLoading(false);
      setDeleteBook(null);
    }
  };

  const handleLoanUpdated = () => {
    loadBooks();
    setSnackbar({ open: true, message: 'פרטי ההשאלה עודכנו', severity: 'success' });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        הספרייה שלי
      </Typography>

      <BookTable
        books={books}
        onDelete={(book) => setDeleteBook(book)}
        onLoan={(book) => setLoanBook(book)}
      />

      {isAdmin && (
        <>
          <DeleteConfirmDialog
            book={deleteBook}
            open={!!deleteBook}
            onClose={() => setDeleteBook(null)}
            onConfirm={handleDelete}
            loading={deleteLoading}
          />
          <LoanDialog
            book={loanBook}
            open={!!loanBook}
            onClose={() => setLoanBook(null)}
            onLoanUpdated={handleLoanUpdated}
          />
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
