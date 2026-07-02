import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Snackbar, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import type { BookFormData, Series } from '../types/book';
import { bookService } from '../services/bookService';
import BookForm from '../components/books/BookForm';
import { useAuth } from '../contexts/AuthContext';
import { wishlistService } from '../services/wishlistService';
import type { WishlistItem } from '../types/wishlist';

export default function AddBookPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nextId, setNextId] = useState<string | null>(null);
  const [existingSeries, setExistingSeries] = useState<Series[]>([]);
  const [wishlistMatch, setWishlistMatch] = useState<WishlistItem | null>(null);

  useEffect(() => {
    bookService.getAllBooks().then((books) => {
      const maxId = books.reduce((max, b) => {
        const n = parseInt(b.internalId || '0', 10);
        return isNaN(n) ? max : Math.max(max, n);
      }, 0);
      setNextId(String(maxId + 1));
      setExistingSeries(books.flatMap((b) => (b.series ? [b.series] : [])));
    }).catch(() => setNextId('1'));
  }, []);

  const handleSubmit = async (data: BookFormData) => {
    setLoading(true);
    setError('');
    try {
      await bookService.addBook(data, user?.email ?? undefined);
      // Check if the new book's title matches any wishlist entry
      if (data.title) {
        try {
          const wishlistItems = await wishlistService.getAll();
          const match = wishlistItems.find(
            (item) => item.bookName.trim().toLowerCase() === data.title.trim().toLowerCase()
          );
          if (match) {
            setWishlistMatch(match);
            return; // Wait for user response in the dialog before navigating
          }
        } catch (err) {
          console.warn('Failed to check wishlist after adding book:', err);
        }
      }
      navigate('/', { state: { message: 'הספר נוסף בהצלחה' } });
    } catch (err) {
      console.error('Error adding book:', err);
      setError('שגיאה בהוספת הספר');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async () => {
    if (wishlistMatch) {
      try {
        await wishlistService.delete(wishlistMatch.id);
      } catch (err) {
        console.error('Failed to remove from wishlist:', err);
      }
    }
    setWishlistMatch(null);
    navigate('/', { state: { message: 'הספר נוסף בהצלחה' } });
  };

  const handleSkipWishlist = () => {
    setWishlistMatch(null);
    navigate('/', { state: { message: 'הספר נוסף בהצלחה' } });
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
          existingSeries={existingSeries}
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

      <Dialog open={!!wishlistMatch} onClose={handleSkipWishlist}>
        <DialogTitle>הסרה מרשימת המשאלות</DialogTitle>
        <DialogContent>
          <DialogContentText>
            הספר נמצא ברשימת המשאלות, האם להסיר אותו משם?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSkipWishlist}>דלג</Button>
          <Button onClick={handleRemoveFromWishlist} variant="contained" color="primary">הסר</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
