import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Divider,
  Rating,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MenuBook as LoanIcon,
  MoreVert as MoreVertIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
  MenuBook as BookIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Book, ReadingStatus } from '../../types/book';
import { useAuth } from '../../contexts/AuthContext';
import { READING_STATUSES } from '../../config/constants';
import BookExpandedRow from './BookExpandedRow';

interface BookCardListProps {
  books: Book[];
  onDelete: (book: Book) => void;
  onLoan: (book: Book) => void;
}

function getAuthorDisplay(book: Book): string {
  return book.authors.map((a) => `${a.firstName} ${a.lastName}`.trim()).join(', ');
}

function StatusChipColor(status?: ReadingStatus | string): 'success' | 'info' | 'default' {
  if (status === 'read') return 'success';
  if (status === 'reading') return 'info';
  return 'default';
}

interface BookCardProps {
  book: Book;
  onDelete: (book: Book) => void;
  onLoan: (book: Book) => void;
}

function BookCard({ book, onDelete, onLoan }: BookCardProps) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };
  const handleMenuClose = () => setMenuAnchor(null);

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1.5,
        borderRadius: 2,
        borderColor: book.currentLoan ? 'warning.light' : undefined,
      }}
    >
      <Box
        sx={{ display: 'flex', alignItems: 'flex-start', p: 1.5, cursor: 'pointer' }}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Cover image or fallback avatar */}
        {book.coverImageUrl ? (
          <Box
            component="img"
            src={book.coverImageUrl}
            alt={book.title}
            sx={{
              width: 52,
              height: 72,
              objectFit: 'cover',
              borderRadius: 1,
              flexShrink: 0,
              mr: 1.5,
            }}
          />
        ) : (
          <Avatar
            variant="rounded"
            sx={{ width: 52, height: 72, flexShrink: 0, mr: 1.5, bgcolor: 'primary.light' }}
          >
            <BookIcon />
          </Avatar>
        )}

        {/* Main info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, lineHeight: 1.3, mb: 0.25 }}
            noWrap
          >
            {book.title}
          </Typography>
          {getAuthorDisplay(book) && (
            <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 0.5 }}>
              {getAuthorDisplay(book)}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
            {book.readingStatus && (
              <Chip
                label={READING_STATUSES[book.readingStatus as ReadingStatus]}
                size="small"
                color={StatusChipColor(book.readingStatus)}
              />
            )}
            {book.currentLoan ? (
              <Chip label={`מושאל ל${book.currentLoan.loanerName}`} size="small" color="warning" />
            ) : null}
            {book.genres?.slice(0, 2).map((g) => (
              <Chip key={g} label={g} size="small" variant="outlined" />
            ))}
          </Box>
          {book.personalRating != null && book.personalRating > 0 && (
            <Rating value={book.personalRating} readOnly size="small" sx={{ mt: 0.5 }} />
          )}
        </Box>

        {/* Right side: expand icon + admin menu */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ml: 0.5 }}>
          <IconButton size="small" onClick={() => setExpanded((v) => !v)}>
            {expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
          {isAdmin && (
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Admin action menu */}
      {isAdmin && (
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem
            onClick={() => {
              handleMenuClose();
              navigate(`/edit/${book.id}`);
            }}
          >
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText>עריכה</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onLoan(book);
            }}
          >
            <ListItemIcon><LoanIcon fontSize="small" /></ListItemIcon>
            <ListItemText>השאלה</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onDelete(book);
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>מחיקה</ListItemText>
          </MenuItem>
        </Menu>
      )}

      {/* Expanded details */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <CardContent sx={{ pt: 1, pb: '8px !important' }}>
          <BookExpandedRow book={book} />
        </CardContent>
      </Collapse>

      {/* Series info shown below when not expanded */}
      {!expanded && book.series?.name && (
        <CardActions sx={{ pt: 0, pb: 1, px: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            סדרה: {book.series.name}
            {book.series.volumeNumber ? ` (${book.series.volumeNumber})` : ''}
          </Typography>
        </CardActions>
      )}
    </Card>
  );
}

export default function BookCardList({ books, onDelete, onLoan }: BookCardListProps) {
  return (
    <Box>
      {books.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          לא נמצאו ספרים
        </Typography>
      ) : (
        books.map((book) => (
          <BookCard key={book.id} book={book} onDelete={onDelete} onLoan={onLoan} />
        ))
      )}
    </Box>
  );
}
