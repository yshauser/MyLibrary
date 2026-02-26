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
  Chip,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Select,
  Button,
} from '@mui/material';
import {
  Edit as EditIcon,
  Check as SaveIcon,
  Close as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Timestamp } from 'firebase/firestore';
import { activityLogService } from '../services/activityLogService';
import type { ActivityLogEntry, ActivityType } from '../types/activityLog';
import { ACTIVITY_TYPE_LABELS } from '../types/activityLog';
import { useAuth } from '../contexts/AuthContext';

const ACTION_COLORS: Record<string, 'success' | 'info' | 'error' | 'warning' | 'default'> = {
  add: 'success',
  edit: 'info',
  delete: 'error',
  loan: 'warning',
  return: 'default',
};

interface EditForm {
  actionType: ActivityType;
  actionDate: string;
  bookTitle: string;
  loanerName: string;
  performedBy: string;
}

type LogSortKey = 'actionDate' | 'actionType' | 'bookTitle' | 'loanerName' | 'performedBy';
type SortOrder = 'asc' | 'desc';

const todayISO = () => new Date().toISOString().split('T')[0];

export default function ActivityLogPage() {
  const { isAdmin, user } = useAuth();
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ actionType: 'add', actionDate: '', bookTitle: '', loanerName: '', performedBy: '' });
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState<LogSortKey>('actionDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState<EditForm>({ actionType: 'add', actionDate: todayISO(), bookTitle: '', loanerName: '', performedBy: user?.email ?? '' });

  const handleSort = (key: LogSortKey) => {
    if (sortKey === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      if (sortKey === 'actionDate') {
        aVal = a.actionDate?.toDate?.().getTime() ?? 0;
        bVal = b.actionDate?.toDate?.().getTime() ?? 0;
      } else {
        aVal = (a[sortKey] ?? '').toString().toLowerCase();
        bVal = (b[sortKey] ?? '').toString().toLowerCase();
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [entries, sortKey, sortOrder]);

  const load = () => {
    activityLogService.getActivityLog()
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const startEdit = (entry: ActivityLogEntry) => {
    setEditId(entry.id);
    setEditForm({
      actionType: entry.actionType,
      actionDate: entry.actionDate?.toDate?.().toISOString().split('T')[0] ?? '',
      bookTitle: entry.bookTitle,
      loanerName: entry.loanerName ?? '',
      performedBy: entry.performedBy,
    });
  };

  const handleSave = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      const update: Partial<Omit<ActivityLogEntry, 'id'>> = {
        actionType: editForm.actionType,
        bookTitle: editForm.bookTitle,
        actionDate: editForm.actionDate ? Timestamp.fromDate(new Date(editForm.actionDate)) : undefined,
      };
      if (editForm.loanerName.trim()) update.loanerName = editForm.loanerName.trim();
      await activityLogService.updateEntry(editId, update);
      setEditId(null);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSave = async () => {
    if (!addForm.bookTitle.trim()) return;
    setSaving(true);
    try {
      await activityLogService.addManualEntry(
        addForm.actionType,
        addForm.actionDate,
        addForm.bookTitle.trim(),
        addForm.performedBy.trim() || (user?.email ?? ''),
        addForm.loanerName
      );
      setAdding(false);
      setAddForm({ actionType: 'add', actionDate: todayISO(), bookTitle: '', loanerName: '', performedBy: user?.email ?? '' });
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          יומן פעילות
        </Typography>
        {isAdmin && !adding && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setAdding(true);
              setAddForm({ actionType: 'add', actionDate: todayISO(), bookTitle: '', loanerName: '', performedBy: user?.email ?? '' });
            }}
          >
            הוסף רשומה
          </Button>
        )}
      </Box>

      {entries.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          אין פעילות מתועדת
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel active={sortKey === 'actionDate'} direction={sortKey === 'actionDate' ? sortOrder : 'asc'} onClick={() => handleSort('actionDate')}>
                    תאריך
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel active={sortKey === 'actionType'} direction={sortKey === 'actionType' ? sortOrder : 'asc'} onClick={() => handleSort('actionType')}>
                    פעולה
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel active={sortKey === 'bookTitle'} direction={sortKey === 'bookTitle' ? sortOrder : 'asc'} onClick={() => handleSort('bookTitle')}>
                    שם הספר
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel active={sortKey === 'loanerName'} direction={sortKey === 'loanerName' ? sortOrder : 'asc'} onClick={() => handleSort('loanerName')}>
                    שם השואל
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel active={sortKey === 'performedBy'} direction={sortKey === 'performedBy' ? sortOrder : 'asc'} onClick={() => handleSort('performedBy')}>
                    בוצע על ידי
                  </TableSortLabel>
                </TableCell>
                {isAdmin && <TableCell sx={{ width: 96 }} />}
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Add row */}
              {isAdmin && adding && (
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>
                    <TextField
                      size="small"
                      type="date"
                      value={addForm.actionDate}
                      onChange={(e) => setAddForm((f) => ({ ...f, actionDate: e.target.value }))}
                      slotProps={{ inputLabel: { shrink: true }, htmlInput: { lang: 'en-GB' } }}
                      sx={{ minWidth: 140 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={addForm.actionType}
                      onChange={(e) => setAddForm((f) => ({ ...f, actionType: e.target.value as ActivityType }))}
                    >
                      {(Object.entries(ACTIVITY_TYPE_LABELS) as [ActivityType, string][]).map(([key, label]) => (
                        <MenuItem key={key} value={key}>{label}</MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="שם הספר *"
                      value={addForm.bookTitle}
                      onChange={(e) => setAddForm((f) => ({ ...f, bookTitle: e.target.value }))}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="שם השואל"
                      value={addForm.loanerName}
                      onChange={(e) => setAddForm((f) => ({ ...f, loanerName: e.target.value }))}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="בוצע על ידי"
                      value={addForm.performedBy}
                      onChange={(e) => setAddForm((f) => ({ ...f, performedBy: e.target.value }))}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="שמור">
                      <span>
                        <IconButton size="small" color="primary" onClick={handleAddSave} disabled={saving || !addForm.bookTitle.trim()}>
                          <SaveIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="ביטול">
                      <IconButton size="small" onClick={() => setAdding(false)}>
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )}

              {sortedEntries.map((entry) => (
                <TableRow key={entry.id} hover>
                  {editId === entry.id ? (
                    <>
                      <TableCell>
                        <TextField
                          size="small"
                          type="date"
                          value={editForm.actionDate}
                          onChange={(e) => setEditForm((f) => ({ ...f, actionDate: e.target.value }))}
                          slotProps={{ inputLabel: { shrink: true }, htmlInput: { lang: 'en-GB' } }}
                          sx={{ minWidth: 140 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          size="small"
                          value={editForm.actionType}
                          onChange={(e) => setEditForm((f) => ({ ...f, actionType: e.target.value as ActivityType }))}
                        >
                          {(Object.entries(ACTIVITY_TYPE_LABELS) as [ActivityType, string][]).map(([key, label]) => (
                            <MenuItem key={key} value={key}>{label}</MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={editForm.bookTitle}
                          onChange={(e) => setEditForm((f) => ({ ...f, bookTitle: e.target.value }))}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={editForm.loanerName}
                          onChange={(e) => setEditForm((f) => ({ ...f, loanerName: e.target.value }))}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>{entry.performedBy}</TableCell>
                      <TableCell>
                        <Tooltip title="שמור">
                          <IconButton size="small" color="primary" onClick={handleSave} disabled={saving}>
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
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {entry.actionDate?.toDate?.().toLocaleDateString('he-IL') ?? ''}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ACTIVITY_TYPE_LABELS[entry.actionType] ?? entry.actionType}
                          size="small"
                          color={ACTION_COLORS[entry.actionType] ?? 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{entry.bookTitle}</TableCell>
                      <TableCell>{entry.loanerName ?? '—'}</TableCell>
                      <TableCell>{entry.performedBy}</TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Tooltip title="עריכה">
                            <IconButton size="small" onClick={() => startEdit(entry)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="מחיקה">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={async () => {
                                if (window.confirm('למחוק רשומה זו?')) {
                                  await activityLogService.deleteEntry(entry.id);
                                  load();
                                }
                              }}
                            >
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
      )}
    </Box>
  );
}
