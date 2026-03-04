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
  InputAdornment,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ExpandMore as ExpandMoreIcon,
  CameraAlt as CameraAltIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import IsbnScanner from './IsbnScanner';
import { fetchBookByIsbn } from '../../services/googleBooksService';
import { fetchBookFromNli } from '../../services/nliService';
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

  const [scannerOpen, setScannerOpen] = useState(false);
  const [additionalExpanded, setAdditionalExpanded] = useState(!!initialData?.isbn);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const handleGoogleBooksLookup = async () => {
    if (!isbn) return;
    setLookingUp(true);
    setLookupError('');
    try {
      const cleanIsbn = isbn.replace(/[^0-9X]/gi, '').toUpperCase();

      let data = await fetchBookFromNli(cleanIsbn);
      if (!data) {
        console.log('NLI returned no results, falling back to Google Books');
        data = await fetchBookByIsbn(cleanIsbn);
      }

      if (!data) {
        setLookupError('לא נמצא ספר עם ISBN זה');
        return;
      }

      if (data.title && !title) setTitle(data.title);
      if (data.originalTitle && !originalTitle) setOriginalTitle(data.originalTitle);
      if (data.authors?.length && (!authors.length || (authors.length === 1 && !authors[0].firstName && !authors[0].lastName))) {
        setAuthors(data.authors.map((name) => {
          const parts = name.trim().split(' ');
          const lastName = parts.pop() || '';
          const firstName = parts.join(' ');
          return { firstName, lastName };
        }));
      }
      if (data.translatedBy && !translatedBy) setTranslatedBy(data.translatedBy);
      if (data.publishingHouse && !publishingHouse) setPublishingHouse(data.publishingHouse);
      if (data.publishedYear && !publishedYear) setPublishedYear(String(data.publishedYear));
      if (data.numberOfPages && !numberOfPages) setNumberOfPages(String(data.numberOfPages));
      if (data.language && !language) setLanguage(data.language);
      if (data.coverImageUrl && !coverImageUrl) setCoverImageUrl(data.coverImageUrl);
      setAdditionalExpanded(true);
    } catch {
      setLookupError('שגיאה בחיפוש פרטי הספר');
    } finally {
      setLookingUp(false);
    }
  };

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
          <Accordion expanded={additionalExpanded} onChange={(_, expanded) => setAdditionalExpanded(expanded)}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" color="primary">פרטים נוספים</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <TextField
                      fullWidth
                      label="ISBN"
                      value={isbn}
                      onChange={(e) => { setIsbn(e.target.value); setLookupError(''); }}
                      error={!!lookupError}
                      helperText={lookupError}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <Tooltip title="סרוק ISBN מהמצלמה">
                                <IconButton size="small" onClick={() => setScannerOpen(true)} edge="end">
                                  <CameraAltIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    <Tooltip title="חפש פרטי ספר לפי ISBN בגוגל ספרים">
                      <span>
                        <IconButton
                          onClick={handleGoogleBooksLookup}
                          disabled={!isbn || lookingUp}
                          color="primary"
                          sx={{ mt: 1 }}
                        >
                          {lookingUp ? <CircularProgress size={20} /> : <SearchIcon />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
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

      <IsbnScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(scanned) => {
          setIsbn(scanned);
          setAdditionalExpanded(true);
          setScannerOpen(false);
        }}
      />
    </Paper>
  );
}
