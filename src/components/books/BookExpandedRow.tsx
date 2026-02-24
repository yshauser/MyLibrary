import {
  Box,
  Typography,
  Grid,
  Chip,
  Rating,
  Divider,
} from '@mui/material';
import type { Book } from '../../types/book';
import { READING_STATUSES } from '../../config/constants';

interface BookExpandedRowProps {
  book: Book;
}

function InfoField({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="caption" color="text.secondary" component="span">
        {label}:{' '}
      </Typography>
      <Typography variant="body2" component="span">
        {value}
      </Typography>
    </Box>
  );
}

export default function BookExpandedRow({ book }: BookExpandedRowProps) {
  return (
    <Box sx={{ py: 2, px: 1 }}>
      <Grid container spacing={3}>
        {/* Basic Info */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            פרטי הספר
          </Typography>
          <InfoField label="מספר מזהה" value={book.internalId} />
          <InfoField label="ISBN" value={book.isbn} />
          <InfoField label="שנת הוצאה" value={book.publishedYear} />
          <InfoField label="הוצאה לאור" value={book.publishingHouse} />
          <InfoField label="מהדורה" value={book.edition} />
          <InfoField label="מספר עמודים" value={book.numberOfPages} />
          <InfoField label="שפה" value={book.language} />
          {book.originalTitle && (
            <>
              <InfoField label="שם מקורי" value={book.originalTitle} />
              <InfoField label="שפה מקורית" value={book.originalLanguage} />
              <InfoField label="מתורגם ע״י" value={book.translatedBy} />
              <InfoField label="שנת תרגום" value={book.translationPublishingYear} />
            </>
          )}
          <InfoField label="מיקום פיזי" value={book.physicalLocation} />
        </Grid>

        {/* Series Info */}
        {book.series?.name && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              סדרה
            </Typography>
            <InfoField label="שם הסדרה" value={book.series.name} />
            <InfoField label="כרך" value={book.series.volumeNumber} />
            {book.series.volumePart && (
              <InfoField label="חלק בכרך" value={book.series.volumePart} />
            )}
            <InfoField label="סה״כ כרכים" value={book.series.totalVolumes} />
            {book.series.hasUntranslatedBooks && (
              <Chip label="יש כרכים שלא תורגמו" size="small" color="warning" variant="outlined" />
            )}
          </Grid>
        )}

        {/* Genres & Status */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            סיווג ומצב
          </Typography>
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              ז׳אנרים:
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
              {book.genres?.map((g) => (
                <Chip key={g} label={g} size="small" />
              ))}
            </Box>
          </Box>
          {book.subGenres?.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                תת-ז׳אנרים:
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                {book.subGenres.map((g) => (
                  <Chip key={g} label={g} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}
          {book.readingStatus && (
            <InfoField label="סטטוס קריאה" value={READING_STATUSES[book.readingStatus]} />
          )}
          {book.personalRating != null && book.personalRating > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                דירוג אישי:
              </Typography>
              <Rating value={book.personalRating} readOnly size="small" sx={{ display: 'block', mt: 0.5 }} />
            </Box>
          )}
        </Grid>

        {/* Loan & Comments */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            השאלה והערות
          </Typography>
          {book.currentLoan ? (
            <Box sx={{ mb: 1 }}>
              <Chip label={`מושאל ל${book.currentLoan.loanerName}`} size="small" color="warning" />
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                תאריך השאלה: {book.currentLoan.loanDate?.toDate?.().toLocaleDateString('he-IL') ?? ''}
              </Typography>
            </Box>
          ) : (
            <Chip label="לא מושאל" size="small" color="success" variant="outlined" sx={{ mb: 1 }} />
          )}
          {book.comments && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="text.secondary">
                הערות:
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                {book.comments}
              </Typography>
            </>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
