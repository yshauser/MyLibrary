import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enGB } from 'date-fns/locale';
import type { Book, LoanRecord } from '../../types/book';
import { loanService } from '../../services/loanService';
import { auth } from '../../config/firebase';

interface LoanDialogProps {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onLoanUpdated: () => void;
}

export default function LoanDialog({ book, open, onClose, onLoanUpdated }: LoanDialogProps) {
  const [tab, setTab] = useState(0);
  const [loanerName, setLoanerName] = useState('');
  const [loanDate, setLoanDate] = useState<Date | null>(new Date());
  const [returnDate, setReturnDate] = useState<Date | null>(new Date());
  const [loanHistory, setLoanHistory] = useState<LoanRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (book && open) {
      loadHistory();
      if (book.currentLoan) {
        setTab(0);
      } else {
        setTab(0);
      }
    }
  }, [book, open]);

  const loadHistory = async () => {
    if (!book) return;
    setHistoryLoading(true);
    try {
      const history = await loanService.getLoanHistory(book.id);
      setLoanHistory(history);
    } catch (error) {
      console.error('Error loading loan history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLoan = async () => {
    if (!book || !loanerName) return;
    setLoading(true);
    try {
      await loanService.loanBook(book.id, loanerName, loanDate ?? undefined, book.title, auth.currentUser?.email ?? undefined);
      setLoanerName('');
      onLoanUpdated();
      onClose();
    } catch (error) {
      console.error('Error loaning book:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!book) return;
    const activeLoan = loanHistory.find((l) => !l.returnDate);
    if (!activeLoan) return;
    setLoading(true);
    try {
      await loanService.returnBook(book.id, activeLoan.id, returnDate ?? undefined, book.title, book.currentLoan?.loanerName, auth.currentUser?.email ?? undefined);
      onLoanUpdated();
      onClose();
    } catch (error) {
      console.error('Error returning book:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!book) return null;

  const isLoaned = !!book.currentLoan;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        ניהול השאלה — {book.title}
        {isLoaned && (
          <Chip label={`מושאל ל${book.currentLoan!.loanerName}`} size="small" color="warning" sx={{ mr: 2 }} />
        )}
      </DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label={isLoaned ? 'החזרה' : 'השאלה'} />
          <Tab label="היסטוריית השאלות" />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ pt: 1 }}>
            {isLoaned ? (
              <>
                <Typography gutterBottom>
                  הספר מושאל ל<strong>{book.currentLoan!.loanerName}</strong> מתאריך{' '}
                  {book.currentLoan!.loanDate?.toDate?.().toLocaleDateString('he-IL') ?? ''}
                </Typography>
                <DatePicker
                  label="תאריך החזרה"
                  value={returnDate}
                  onChange={setReturnDate}
                  format="dd/MM/yyyy"
                  maxDate={new Date()}
                  slotProps={{ textField: { fullWidth: true, sx: { mt: 2 } } }}
                />
              </>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="שם השואל"
                  value={loanerName}
                  onChange={(e) => setLoanerName(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <DatePicker
                  label="תאריך השאלה"
                  value={loanDate}
                  onChange={setLoanDate}
                  format="dd/MM/yyyy"
                  maxDate={new Date()}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ pt: 1 }}>
            {historyLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : loanHistory.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                אין היסטוריית השאלות
              </Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>שם השואל</TableCell>
                      <TableCell>תאריך השאלה</TableCell>
                      <TableCell>תאריך החזרה</TableCell>
                      <TableCell>סטטוס</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loanHistory.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell>{loan.loanerName}</TableCell>
                        <TableCell>
                          {loan.loanDate?.toDate?.().toLocaleDateString('he-IL') ?? ''}
                        </TableCell>
                        <TableCell>
                          {loan.returnDate?.toDate?.().toLocaleDateString('he-IL') ?? '—'}
                        </TableCell>
                        <TableCell>
                          {loan.returnDate ? (
                            <Chip label="הוחזר" size="small" color="success" variant="outlined" />
                          ) : (
                            <Chip label="מושאל" size="small" color="warning" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>סגור</Button>
        {tab === 0 && (
          isLoaned ? (
            <Button variant="contained" onClick={handleReturn} disabled={loading}>
              {loading ? 'מעדכן...' : 'רשום החזרה'}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleLoan} disabled={loading || !loanerName}>
              {loading ? 'מעדכן...' : 'רשום השאלה'}
            </Button>
          )
        )}
      </DialogActions>
    </Dialog>
  );
}
