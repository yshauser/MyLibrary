import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Select,
} from '@mui/material';
import {
  Edit as EditIcon,
  Check as SaveIcon,
  Close as CancelIcon,
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
}

export default function ActivityLogPage() {
  const { isAdmin } = useAuth();
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ actionType: 'add', actionDate: '', bookTitle: '', loanerName: '' });
  const [saving, setSaving] = useState(false);

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
        יומן פעילות
      </Typography>

      {entries.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          אין פעילות מתועדת
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>תאריך</TableCell>
                <TableCell>פעולה</TableCell>
                <TableCell>שם הספר</TableCell>
                <TableCell>שם השואל</TableCell>
                <TableCell>בוצע על ידי</TableCell>
                {isAdmin && <TableCell sx={{ width: 80 }} />}
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} hover>
                  {editId === entry.id ? (
                    <>
                      <TableCell>
                        <TextField
                          size="small"
                          type="date"
                          value={editForm.actionDate}
                          onChange={(e) => setEditForm((f) => ({ ...f, actionDate: e.target.value }))}
                          InputLabelProps={{ shrink: true }}
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
