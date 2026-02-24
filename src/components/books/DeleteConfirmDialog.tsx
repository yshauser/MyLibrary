import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import type { Book } from '../../types/book';

interface DeleteConfirmDialogProps {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function DeleteConfirmDialog({
  book,
  open,
  onClose,
  onConfirm,
  loading,
}: DeleteConfirmDialogProps) {
  if (!book) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>מחיקת ספר</DialogTitle>
      <DialogContent>
        <Typography>
          האם אתה בטוח שברצונך למחוק את הספר <strong>"{book.title}"</strong>?
        </Typography>
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          פעולה זו אינה הפיכה.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ביטול</Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'מוחק...' : 'מחק'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
