import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Paper,
  TextField,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Collapse,
  Typography,
  InputAdornment,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
  MenuBook as LoanIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Book, ReadingStatus } from '../../types/book';
import { useAuth } from '../../contexts/AuthContext';
import { GENRES, SUB_GENRES, READING_STATUSES } from '../../config/constants';
import BookExpandedRow from './BookExpandedRow';

interface BookTableProps {
  books: Book[];
  onDelete: (book: Book) => void;
  onLoan: (book: Book) => void;
}

type Order = 'asc' | 'desc';
type SortableField = 'internalId' | 'title' | 'authors' | 'genres' | 'readingStatus';

function getAuthorDisplay(book: Book): string {
  return book.authors
    .map((a) => `${a.firstName} ${a.lastName}`)
    .join(', ');
}

function getComparatorValue(book: Book, field: SortableField): string {
  switch (field) {
    case 'internalId':
      return book.internalId || '';
    case 'title':
      return book.title || '';
    case 'authors':
      return book.authors?.[0]?.lastName || '';
    case 'genres':
      return book.genres?.[0] || '';
    case 'readingStatus':
      return book.readingStatus || '';
    default:
      return '';
  }
}

export default function BookTable({ books, onDelete, onLoan }: BookTableProps) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [subGenreFilter, setSubGenreFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loanFilter, setLoanFilter] = useState('');
  const [orderBy, setOrderBy] = useState<SortableField>('internalId');
  const [order, setOrder] = useState<Order>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleSort = (field: SortableField) => {
    const isAsc = orderBy === field && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(field);
  };

  const filteredAndSortedBooks = useMemo(() => {
    let filtered = [...books];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (book) =>
          book.title?.toLowerCase().includes(q) ||
          book.internalId?.toLowerCase().includes(q) ||
          book.isbn?.toLowerCase().includes(q) ||
          book.authors?.some(
            (a) =>
              a.firstName?.toLowerCase().includes(q) ||
              a.lastName?.toLowerCase().includes(q)
          ) ||
          book.series?.name?.toLowerCase().includes(q)
      );
    }

    if (genreFilter) {
      filtered = filtered.filter((book) => book.genres?.includes(genreFilter));
    }

    if (subGenreFilter) {
      filtered = filtered.filter((book) => book.subGenres?.includes(subGenreFilter));
    }

    if (statusFilter) {
      filtered = filtered.filter((book) => book.readingStatus === statusFilter);
    }

    if (loanFilter === 'loaned') {
      filtered = filtered.filter((book) => book.currentLoan);
    } else if (loanFilter === 'available') {
      filtered = filtered.filter((book) => !book.currentLoan);
    }

    filtered.sort((a, b) => {
      let comparison: number;
      if (orderBy === 'internalId') {
        const aNum = parseInt(a.internalId || '0', 10) || 0;
        const bNum = parseInt(b.internalId || '0', 10) || 0;
        comparison = aNum - bNum;
      } else {
        const aVal = getComparatorValue(a, orderBy);
        const bVal = getComparatorValue(b, orderBy);
        comparison = aVal.localeCompare(bVal, 'he');
      }
      return order === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [books, searchQuery, genreFilter, subGenreFilter, statusFilter, loanFilter, orderBy, order]);

  const paginatedBooks = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredAndSortedBooks.slice(start, start + rowsPerPage);
  }, [filteredAndSortedBooks, page, rowsPerPage]);

  const clearFilters = () => {
    setSearchQuery('');
    setGenreFilter('');
    setSubGenreFilter('');
    setStatusFilter('');
    setLoanFilter('');
    setPage(0);
  };

  const hasActiveFilters = searchQuery || genreFilter || subGenreFilter || statusFilter || loanFilter;

  return (
    <Box>
      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            placeholder="חיפוש לפי שם ספר, מחבר, ISBN, מספר מזהה, סדרה..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            size="small"
          />
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>ז׳אנר</InputLabel>
              <Select
                value={genreFilter}
                label="ז׳אנר"
                onChange={(e: SelectChangeEvent) => { setGenreFilter(e.target.value); setPage(0); }}
              >
                <MenuItem value="">הכל</MenuItem>
                {GENRES.map((g) => (
                  <MenuItem key={g} value={g}>{g}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>תת-ז׳אנר</InputLabel>
              <Select
                value={subGenreFilter}
                label="תת-ז׳אנר"
                onChange={(e: SelectChangeEvent) => { setSubGenreFilter(e.target.value); setPage(0); }}
              >
                <MenuItem value="">הכל</MenuItem>
                {SUB_GENRES.map((g) => (
                  <MenuItem key={g} value={g}>{g}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>סטטוס קריאה</InputLabel>
              <Select
                value={statusFilter}
                label="סטטוס קריאה"
                onChange={(e: SelectChangeEvent) => { setStatusFilter(e.target.value); setPage(0); }}
              >
                <MenuItem value="">הכל</MenuItem>
                {Object.entries(READING_STATUSES).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>השאלה</InputLabel>
              <Select
                value={loanFilter}
                label="השאלה"
                onChange={(e: SelectChangeEvent) => { setLoanFilter(e.target.value); setPage(0); }}
              >
                <MenuItem value="">הכל</MenuItem>
                <MenuItem value="loaned">מושאל</MenuItem>
                <MenuItem value="available">זמין</MenuItem>
              </Select>
            </FormControl>
            {hasActiveFilters && (
              <Tooltip title="נקה סינונים">
                <IconButton onClick={clearFilters} size="small" color="secondary">
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {filteredAndSortedBooks.length} ספרים
            {hasActiveFilters ? ` (מסונן מתוך ${books.length})` : ''}
          </Typography>
        </Stack>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table size={isMobile ? 'small' : 'medium'}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', width: 40 }} />
              <TableCell sx={{ color: 'white' }}>
                <TableSortLabel
                  active={orderBy === 'internalId'}
                  direction={orderBy === 'internalId' ? order : 'asc'}
                  onClick={() => handleSort('internalId')}
                  sx={{ '&.MuiTableSortLabel-root': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                >
                  מס׳
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white' }}>
                <TableSortLabel
                  active={orderBy === 'title'}
                  direction={orderBy === 'title' ? order : 'asc'}
                  onClick={() => handleSort('title')}
                  sx={{ '&.MuiTableSortLabel-root': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                >
                  שם הספר
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white' }}>
                <TableSortLabel
                  active={orderBy === 'authors'}
                  direction={orderBy === 'authors' ? order : 'asc'}
                  onClick={() => handleSort('authors')}
                  sx={{ '&.MuiTableSortLabel-root': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                >
                  מחבר
                </TableSortLabel>
              </TableCell>
              {!isMobile && (
                <>
                  <TableCell sx={{ color: 'white' }}>
                    <TableSortLabel
                      active={orderBy === 'genres'}
                      direction={orderBy === 'genres' ? order : 'asc'}
                      onClick={() => handleSort('genres')}
                      sx={{ '&.MuiTableSortLabel-root': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                    >
                      ז׳אנר
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: 'white' }}>סדרה</TableCell>
                  <TableCell sx={{ color: 'white' }}>
                    <TableSortLabel
                      active={orderBy === 'readingStatus'}
                      direction={orderBy === 'readingStatus' ? order : 'asc'}
                      onClick={() => handleSort('readingStatus')}
                      sx={{ '&.MuiTableSortLabel-root': { color: 'white' }, '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                    >
                      סטטוס
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: 'white' }}>השאלה</TableCell>
                </>
              )}
              {isAdmin && <TableCell sx={{ color: 'white' }}>פעולות</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedBooks.map((book) => (
              <>
                <TableRow
                  key={book.id}
                  hover
                  sx={{ cursor: 'pointer', '& > *': { borderBottom: expandedRow === book.id ? 'unset' : undefined } }}
                  onClick={() => setExpandedRow(expandedRow === book.id ? null : book.id)}
                >
                  <TableCell>
                    <IconButton size="small">
                      {expandedRow === book.id ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                  </TableCell>
                  <TableCell>{book.internalId}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{book.title}</TableCell>
                  <TableCell>{getAuthorDisplay(book)}</TableCell>
                  {!isMobile && (
                    <>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {book.genres?.map((g) => (
                            <Chip key={g} label={g} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {book.series?.name && (
                          <Typography variant="body2">
                            {book.series.name}
                            {book.series.volumeNumber ? ` (${book.series.volumeNumber})` : ''}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {book.readingStatus && (
                          <Chip
                            label={READING_STATUSES[book.readingStatus as ReadingStatus]}
                            size="small"
                            color={
                              book.readingStatus === 'read'
                                ? 'success'
                                : book.readingStatus === 'reading'
                                ? 'info'
                                : 'default'
                            }
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {book.currentLoan ? (
                          <Chip label={`מושאל ל${book.currentLoan.loanerName}`} size="small" color="warning" />
                        ) : (
                          <Chip label="זמין" size="small" color="success" variant="outlined" />
                        )}
                      </TableCell>
                    </>
                  )}
                  {isAdmin && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="עריכה">
                          <IconButton size="small" onClick={() => navigate(`/edit/${book.id}`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="השאלה">
                          <IconButton size="small" onClick={() => onLoan(book)}>
                            <LoanIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="מחיקה">
                          <IconButton size="small" color="error" onClick={() => onDelete(book)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
                <TableRow key={`${book.id}-expand`}>
                  <TableCell sx={{ py: 0 }} colSpan={isAdmin ? (isMobile ? 5 : 9) : (isMobile ? 4 : 8)}>
                    <Collapse in={expandedRow === book.id} timeout="auto" unmountOnExit>
                      <BookExpandedRow book={book} />
                    </Collapse>
                  </TableCell>
                </TableRow>
              </>
            ))}
            {paginatedBooks.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 9 : 8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {books.length === 0 ? 'אין ספרים בספרייה' : 'לא נמצאו ספרים התואמים את החיפוש'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredAndSortedBooks.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="שורות בעמוד:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
        />
      </TableContainer>
    </Box>
  );
}
