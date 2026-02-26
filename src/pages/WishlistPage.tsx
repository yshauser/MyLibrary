import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as SaveIcon,
  Close as CancelIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { wishlistService } from '../services/wishlistService';
import type { WishlistItem, WishlistFormData } from '../types/wishlist';
import { useAuth } from '../contexts/AuthContext';

type SortKey = keyof Omit<WishlistItem, 'id' | 'dateAdded'>;
type SortOrder = 'asc' | 'desc';

function compareValues(a: string | undefined, b: string | undefined, order: SortOrder): number {
  const empty = order === 'asc' ? 1 : -1;
  if (!a && !b) return 0;
  if (!a) return empty;
  if (!b) return -empty;
  const numA = Number(a);
  const numB = Number(b);
  if (!isNaN(numA) && !isNaN(numB)) {
    return order === 'asc' ? numA - numB : numB - numA;
  }
  return order === 'asc' ? a.localeCompare(b, 'he') : b.localeCompare(a, 'he');
}

const emptyForm: WishlistFormData = {
  bookName: '',
  seriesName: '',
  bookVolume: '',
  author: '',
  publishingHouse: '',
};

export default function WishlistPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('seriesName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const primary = compareValues(a[sortKey] as string | undefined, b[sortKey] as string | undefined, sortOrder);
      if (primary !== 0) return primary;
      if (sortKey !== 'bookVolume') {
        return compareValues(a.bookVolume, b.bookVolume, 'asc');
      }
      return 0;
    });
  }, [items, sortKey, sortOrder]);

  const [addForm, setAddForm] = useState<WishlistFormData>({ ...emptyForm });
  const [adding, setAdding] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<WishlistFormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await wishlistService.getAll();
      setItems(data);
    } catch (e) {
      console.error(e);
      setError('שגיאה בטעינת רשימת המשאלות');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!addForm.bookName.trim()) return;
    setAdding(true);
    try {
      const clean: WishlistFormData = { bookName: addForm.bookName.trim() };
      if (addForm.seriesName?.trim()) clean.seriesName = addForm.seriesName.trim();
      if (addForm.bookVolume?.trim()) clean.bookVolume = addForm.bookVolume.trim();
      if (addForm.author?.trim()) clean.author = addForm.author.trim();
      if (addForm.publishingHouse?.trim()) clean.publishingHouse = addForm.publishingHouse.trim();
      await wishlistService.add(clean);
      setAddForm({ ...emptyForm });
      await load();
    } catch (e) {
      console.error(e);
      setError('שגיאה בהוספה');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (item: WishlistItem) => {
    setEditId(item.id);
    setEditForm({
      bookName: item.bookName,
      seriesName: item.seriesName ?? '',
      bookVolume: item.bookVolume ?? '',
      author: item.author ?? '',
      publishingHouse: item.publishingHouse ?? '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editId || !editForm.bookName.trim()) return;
    setSaving(true);
    try {
      const clean: WishlistFormData = { bookName: editForm.bookName.trim() };
      if (editForm.seriesName?.trim()) clean.seriesName = editForm.seriesName.trim();
      if (editForm.bookVolume?.trim()) clean.bookVolume = editForm.bookVolume.trim();
      if (editForm.author?.trim()) clean.author = editForm.author.trim();
      if (editForm.publishingHouse?.trim()) clean.publishingHouse = editForm.publishingHouse.trim();
      await wishlistService.update(editId, clean);
      setEditId(null);
      await load();
    } catch (e) {
      console.error(e);
      setError('שגיאה בעדכון');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await wishlistService.delete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      console.error(e);
      setError('שגיאה במחיקה');
    }
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
        רשימת משאלות
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortKey === 'bookName'}
                  direction={sortKey === 'bookName' ? sortOrder : 'asc'}
                  onClick={() => handleSort('bookName')}
                >שם הספר</TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortKey === 'seriesName'}
                  direction={sortKey === 'seriesName' ? sortOrder : 'asc'}
                  onClick={() => handleSort('seriesName')}
                >סדרה</TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortKey === 'bookVolume'}
                  direction={sortKey === 'bookVolume' ? sortOrder : 'asc'}
                  onClick={() => handleSort('bookVolume')}
                >כרך</TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortKey === 'author'}
                  direction={sortKey === 'author' ? sortOrder : 'asc'}
                  onClick={() => handleSort('author')}
                >מחבר</TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortKey === 'publishingHouse'}
                  direction={sortKey === 'publishingHouse' ? sortOrder : 'asc'}
                  onClick={() => handleSort('publishingHouse')}
                >הוצאה לאור</TableSortLabel>
              </TableCell>
              {isAdmin && <TableCell sx={{ width: 96 }}></TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Add row */}
            {isAdmin && (
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>
                  <TextField
                    size="small"
                    placeholder="שם הספר *"
                    value={addForm.bookName}
                    onChange={(e) => setAddForm((f) => ({ ...f, bookName: e.target.value }))}
                    required
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    placeholder="סדרה"
                    value={addForm.seriesName}
                    onChange={(e) => setAddForm((f) => ({ ...f, seriesName: e.target.value }))}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    placeholder="כרך"
                    value={addForm.bookVolume}
                    onChange={(e) => setAddForm((f) => ({ ...f, bookVolume: e.target.value }))}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    placeholder="מחבר"
                    value={addForm.author}
                    onChange={(e) => setAddForm((f) => ({ ...f, author: e.target.value }))}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    placeholder="הוצאה לאור"
                    value={addForm.publishingHouse}
                    onChange={(e) => setAddForm((f) => ({ ...f, publishingHouse: e.target.value }))}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                    disabled={adding || !addForm.bookName.trim()}
                  >
                    הוסף
                  </Button>
                </TableCell>
              </TableRow>
            )}

            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  רשימת המשאלות ריקה
                </TableCell>
              </TableRow>
            )}

            {sortedItems.map((item) => (
              <TableRow key={item.id} hover>
                {editId === item.id ? (
                  <>
                    <TableCell>
                      <TextField size="small" fullWidth value={editForm.bookName}
                        onChange={(e) => setEditForm((f) => ({ ...f, bookName: e.target.value }))} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" fullWidth value={editForm.seriesName}
                        onChange={(e) => setEditForm((f) => ({ ...f, seriesName: e.target.value }))} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" fullWidth value={editForm.bookVolume}
                        onChange={(e) => setEditForm((f) => ({ ...f, bookVolume: e.target.value }))} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" fullWidth value={editForm.author}
                        onChange={(e) => setEditForm((f) => ({ ...f, author: e.target.value }))} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" fullWidth value={editForm.publishingHouse}
                        onChange={(e) => setEditForm((f) => ({ ...f, publishingHouse: e.target.value }))} />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="שמור">
                        <IconButton size="small" color="primary" onClick={handleSaveEdit} disabled={saving}>
                          <SaveIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="ביטול">
                        <IconButton size="small" onClick={() => setEditId(null)}>
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{item.bookName}</TableCell>
                    <TableCell>{item.seriesName ?? '—'}</TableCell>
                    <TableCell>{item.bookVolume ?? '—'}</TableCell>
                    <TableCell>{item.author ?? '—'}</TableCell>
                    <TableCell>{item.publishingHouse ?? '—'}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Tooltip title="עריכה">
                          <IconButton size="small" onClick={() => startEdit(item)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="מחיקה">
                          <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
