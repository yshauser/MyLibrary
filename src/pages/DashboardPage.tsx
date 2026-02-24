import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { Book } from '../types/book';
import { bookService } from '../services/bookService';
import { READING_STATUSES } from '../config/constants';

interface StatCardProps {
  title: string;
  value: string | number;
  color?: string;
}

function StatCard({ title, value, color = 'primary.main' }: StatCardProps) {
  return (
    <Paper sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h3" sx={{ fontWeight: 700, color }}>
        {value}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {title}
      </Typography>
    </Paper>
  );
}

export default function DashboardPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const allBooks = await bookService.getAllBooks();
        setBooks(allBooks);
      } catch (error) {
        console.error('Error loading books:', error);
      } finally {
        setLoading(false);
      }
    };
    loadBooks();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const totalBooks = books.length;
  const loanedBooks = books.filter((b) => b.currentLoan).length;
  const readBooks = books.filter((b) => b.readingStatus === 'read').length;
  const readingBooks = books.filter((b) => b.readingStatus === 'reading').length;

  // Genre distribution
  const genreCounts: Record<string, number> = {};
  books.forEach((book) => {
    book.genres?.forEach((genre) => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
  });
  const genreData = Object.entries(genreCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Reading status distribution
  const statusData = [
    { name: READING_STATUSES.read, value: readBooks },
    { name: READING_STATUSES.reading, value: readingBooks },
    { name: READING_STATUSES.unread, value: books.filter((b) => b.readingStatus === 'unread' || !b.readingStatus).length },
  ];

  // Top authors
  const authorCounts: Record<string, number> = {};
  books.forEach((book) => {
    book.authors?.forEach((author) => {
      const name = `${author.firstName} ${author.lastName}`.trim();
      if (name) {
        authorCounts[name] = (authorCounts[name] || 0) + 1;
      }
    });
  });
  const topAuthors = Object.entries(authorCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        סטטיסטיקות
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard title="סה״כ ספרים" value={totalBooks} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard title="ספרים מושאלים" value={loanedBooks} color="warning.main" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard title="נקראו" value={readBooks} color="success.main" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard title="בקריאה" value={readingBooks} color="info.main" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Genre Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>ספרים לפי ז׳אנר</Typography>
            {genreData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={genreData} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1565c0" name="ספרים" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary">אין נתונים</Typography>
            )}
          </Paper>
        </Grid>

        {/* Reading Status Pie */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>סטטוס קריאה</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((_, index) => (
                    <Cell key={index} fill={['#2e7d32', '#1565c0', '#bdbdbd'][index]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Authors */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>מחברים מובילים</Typography>
            {topAuthors.map((author, index) => (
              <Box key={author.name} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: index < topAuthors.length - 1 ? '1px solid #eee' : 'none' }}>
                <Typography variant="body2">{author.name}</Typography>
                <Typography variant="body2" fontWeight={700}>{author.value}</Typography>
              </Box>
            ))}
            {topAuthors.length === 0 && (
              <Typography color="text.secondary">אין נתונים</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
