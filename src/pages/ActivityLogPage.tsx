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
} from '@mui/material';
import { activityLogService } from '../services/activityLogService';
import type { ActivityLogEntry } from '../types/activityLog';
import { ACTIVITY_TYPE_LABELS } from '../types/activityLog';

const ACTION_COLORS: Record<string, 'success' | 'info' | 'error' | 'warning' | 'default'> = {
  add: 'success',
  edit: 'info',
  delete: 'error',
  loan: 'warning',
  return: 'default',
};

export default function ActivityLogPage() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    activityLogService.getActivityLog()
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
                <TableCell>תאריך ושעה</TableCell>
                <TableCell>פעולה</TableCell>
                <TableCell>שם הספר</TableCell>
                <TableCell>שם השואל</TableCell>
                <TableCell>בוצע על ידי</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {entry.actionDate?.toDate?.().toLocaleString('he-IL') ?? ''}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
