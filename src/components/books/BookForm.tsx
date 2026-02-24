import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  Switch,
  FormControlLabel,
  OutlinedInput,
  Stack,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import type { Book, BookFormData, Author } from '../../types/book';
import { GENRES, SUB_GENRES, READING_STATUSES } from '../../config/constants';

interface BookFormProps {
  initialData?: Book;
  onSubmit: (data: BookFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const emptyAuthor: Author = { firstName: '', lastName: '' };

export default function BookForm({ initialData, onSubmit, onCancel, isLoading }: BookFormProps) {
  const [internalId, setInternalId] = useState(initialData?.internalId || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [originalTitle, setOriginalTitle] = useState(initialData?.originalTitle || '');
  const [authors, setAuthors] = useState<Author[]>(
    initialData?.authors?.length ? initialData.authors : [{ ...emptyAuthor }]
  );
  const [language, setLanguage] = useState(initialData?.language || 'עברית');
  const [originalLanguage, setOriginalLanguage] = useState(initialData?.originalLanguage || '');
  const [isbn, setIsbn] = useState(initialData?.isbn || '');
  const [publishedYear, setPublishedYear] = useState<string>(
    initialData?.publishedYear?.toString() || ''
  );
  const [translatedBy, setTranslatedBy] = useState(initialData?.translatedBy || '');
  const [translationPublishingYear, setTranslationPublishingYear] = useState<string>(
    initialData?.translationPublishingYear?.toString() || ''
  );
  const [publishingHouse, setPublishingHouse] = useState(initialData?.publishingHouse || '');
  const [edition, setEdition] = useState(initialData?.edition || '');
  const [numberOfPages, setNumberOfPages] = useState<string>(
    initialData?.numberOfPages?.toString() || ''
  );
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.coverImageUrl || '');
  const [genres, setGenres] = useState<string[]>(initialData?.genres || []);
  const [subGenres, setSubGenres] = useState<string[]>(initialData?.subGenres || []);
  const [comments, setComments] = useState(initialData?.comments || '');
  const [physicalLocation, setPhysicalLocation] = useState(initialData?.physicalLocation || '');
  const [readingStatus, setReadingStatus] = useState(initialData?.readingStatus || '-/-');
  const [personalRating, setPersonalRating] = useState<number | null>(
    initialData?.personalRating || null
  );

  // Series state
  const [hasSeries, setHasSeries] = useState(!!initialData?.series?.name);
  const [seriesName, setSeriesName] = useState(initialData?.series?.name || '');
  const [volumeNumber, setVolumeNumber] = useState<string>(
    initialData?.series?.volumeNumber?.toString() || ''
  );
  const [volumePart, setVolumePart] = useState<string>(
    initialData?.series?.volumePart?.toString() || ''
  );
  const [totalVolumes, setTotalVolumes] = useState<string>(
    initialData?.series?.totalVolumes?.toString() || ''
  );
  const [hasUntranslatedBooks, setHasUntranslatedBooks] = useState(
    initialData?.series?.hasUntranslatedBooks || false
  );

  const handleAddAuthor = () => {
    setAuthors([...authors, { ...emptyAuthor }]);
  };

  const handleRemoveAuthor = (index: number) => {
    if (authors.length > 1) {
      setAuthors(authors.filter((_, i) => i !== index));
    }
  };

  const handleAuthorChange = (index: number, field: keyof Author, value: string) => {
    const newAuthors = [...authors];
    newAuthors[index] = { ...newAuthors[index], [field]: value };
    setAuthors(newAuthors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const bookData: BookFormData = {
      internalId,
      title,
      authors: authors.filter((a) => a.firstName || a.lastName),
      genres,
      subGenres,
      comments: comments || undefined,
      physicalLocation: physicalLocation || undefined,
      readingStatus: readingStatus as BookFormData['readingStatus'],
      personalRating: personalRating || undefined,
      currentLoan: initialData?.currentLoan || null,
    };

    if (originalTitle) bookData.originalTitle = originalTitle;
    if (language) bookData.language = language;
    if (originalLanguage) bookData.originalLanguage = originalLanguage;
    if (isbn) bookData.isbn = isbn;
    if (publishedYear) bookData.publishedYear = parseInt(publishedYear);
    if (translatedBy) bookData.translatedBy = translatedBy;
    if (translationPublishingYear) bookData.translationPublishingYear = parseInt(translationPublishingYear);
    if (publishingHouse) bookData.publishingHouse = publishingHouse;
    if (edition) bookData.edition = edition;
    if (numberOfPages) bookData.numberOfPages = parseInt(numberOfPages);
    if (coverImageUrl) bookData.coverImageUrl = coverImageUrl;

    if (hasSeries && seriesName) {
      bookData.series = {
        name: seriesName,
        volumeNumber: volumeNumber ? parseInt(volumeNumber) : undefined,
        volumePart: volumePart ? parseInt(volumePart) : undefined,
        totalVolumes: totalVolumes ? parseInt(totalVolumes) : undefined,
        hasUntranslatedBooks,
      };
    }

    await onSubmit(bookData);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Basic Info */}
          <Typography variant="h6" color="primary">פרטים בסיסיים</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                required
                label="מספר מזהה"
                value={internalId}
                onChange={(e) => setInternalId(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 9 }}>
              <TextField
                fullWidth
                required
                label="שם הספר"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Grid>
          </Grid>

          {/* Authors */}
          <Typography variant="h6" color="primary">מחברים</Typography>
          {authors.map((author, index) => (
            <Grid container spacing={2} key={index} alignItems="center">
              <Grid size={{ xs: 5 }}>
                <TextField
                  fullWidth
                  label="שם פרטי"
                  value={author.firstName}
                  onChange={(e) => handleAuthorChange(index, 'firstName', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 5 }}>
                <TextField
                  fullWidth
                  label="שם משפחה"
                  value={author.lastName}
                  onChange={(e) => handleAuthorChange(index, 'lastName', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 2 }}>
                <Box sx={{ display: 'flex' }}>
                  {authors.length > 1 && (
                    <IconButton onClick={() => handleRemoveAuthor(index)} color="error" size="small">
                      <RemoveIcon />
                    </IconButton>
                  )}
                  {index === authors.length - 1 && (
                    <IconButton onClick={handleAddAuthor} color="primary" size="small">
                      <AddIcon />
                    </IconButton>
                  )}
                </Box>
              </Grid>
            </Grid>
          ))}

          {/* Genres */}
          <Typography variant="h6" color="primary">סיווג</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>ז׳אנרים</InputLabel>
                <Select<string[]>
                  multiple
                  value={genres}
                  onChange={(e) => setGenres(e.target.value as string[])}
                  input={<OutlinedInput label="ז׳אנרים" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value: string) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {GENRES.map((g) => (
                    <MenuItem key={g} value={g}>{g}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>תת-ז׳אנרים</InputLabel>
                <Select<string[]>
                  multiple
                  value={subGenres}
                  onChange={(e) => setSubGenres(e.target.value as string[])}
                  input={<OutlinedInput label="תת-ז׳אנרים" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value: string) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {SUB_GENRES.map((g) => (
                    <MenuItem key={g} value={g}>{g}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Additional Info */}
          <Accordion defaultExpanded={!!initialData?.isbn}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" color="primary">פרטים נוספים</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label="ISBN" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField fullWidth label="שנת הוצאה" type="number" value={publishedYear} onChange={(e) => setPublishedYear(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField fullWidth label="הוצאה לאור" value={publishingHouse} onChange={(e) => setPublishingHouse(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField fullWidth label="מהדורה" value={edition} onChange={(e) => setEdition(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField fullWidth label="מספר עמודים" type="number" value={numberOfPages} onChange={(e) => setNumberOfPages(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label="שפה" value={language} onChange={(e) => setLanguage(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label="שם מקורי" value={originalTitle} onChange={(e) => setOriginalTitle(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField fullWidth label="שפה מקורית" value={originalLanguage} onChange={(e) => setOriginalLanguage(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField fullWidth label="מתורגם ע״י" value={translatedBy} onChange={(e) => setTranslatedBy(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField fullWidth label="שנת תרגום" type="number" value={translationPublishingYear} onChange={(e) => setTranslationPublishingYear(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label="קישור לתמונת כריכה" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth label="מיקום פיזי" value={physicalLocation} onChange={(e) => setPhysicalLocation(e.target.value)} />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Series */}
          <Accordion expanded={hasSeries} onChange={(_, expanded) => setHasSeries(expanded)}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" color="primary">סדרה</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="שם הסדרה" value={seriesName} onChange={(e) => setSeriesName(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField fullWidth label="מספר כרך" type="number" value={volumeNumber} onChange={(e) => setVolumeNumber(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField fullWidth label="חלק בכרך" type="number" value={volumePart} onChange={(e) => setVolumePart(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField fullWidth label="סה״כ כרכים" type="number" value={totalVolumes} onChange={(e) => setTotalVolumes(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch checked={hasUntranslatedBooks} onChange={(e) => setHasUntranslatedBooks(e.target.checked)} />
                    }
                    label="יש כרכים שלא תורגמו"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Reading Status & Rating */}
          <Typography variant="h6" color="primary">מצב קריאה</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>סטטוס קריאה</InputLabel>
                <Select
                  value={readingStatus}
                  label="סטטוס קריאה"
                  onChange={(e: SelectChangeEvent) => setReadingStatus(e.target.value as 'unread' | 'reading' | 'read')}
                >
                  {Object.entries(READING_STATUSES).map(([key, label]) => (
                    <MenuItem key={key} value={key}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="body2" gutterBottom>דירוג אישי</Typography>
              <Rating
                value={personalRating}
                onChange={(_, value) => setPersonalRating(value)}
              />
            </Grid>
          </Grid>

          {/* Comments */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="הערות"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoading || !title || !internalId}
            >
              {isLoading ? 'שומר...' : initialData ? 'עדכן ספר' : 'הוסף ספר'}
            </Button>
            <Button variant="outlined" size="large" onClick={onCancel}>
              ביטול
            </Button>
          </Box>
        </Stack>
      </form>
    </Paper>
  );
}
