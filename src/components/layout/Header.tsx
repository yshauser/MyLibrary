import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getTabValue = () => {
    if (location.pathname === '/dashboard') return 1;
    return 0;
  };

  const [tabValue, setTabValue] = useState(getTabValue());

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 0) navigate('/');
    if (newValue === 1) navigate('/dashboard');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <AppBar position="sticky" sx={{ bgcolor: 'primary.main' }}>
      <Toolbar>
        <Typography
          variant={isMobile ? 'h6' : 'h5'}
          component="div"
          sx={{ fontWeight: 700, cursor: 'pointer', ml: 2 }}
          onClick={() => { setTabValue(0); navigate('/'); }}
        >
          📚 הספרייה שלי
        </Typography>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          textColor="inherit"
          indicatorColor="secondary"
          sx={{ mx: 2 }}
        >
          <Tab label="ספרייה" />
          <Tab label="סטטיסטיקה" />
        </Tabs>

        <Box sx={{ flexGrow: 1 }} />

        {isAdmin && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="הוספת ספר">
              <IconButton color="inherit" onClick={() => navigate('/add')}>
                <AddIcon />
              </IconButton>
            </Tooltip>
            {!isMobile && (
              <>
                <Tooltip title="ייצוא">
                  <IconButton color="inherit" onClick={() => navigate('/export')}>
                    <ExportIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="ייבוא">
                  <IconButton color="inherit" onClick={() => navigate('/import')}>
                    <ImportIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              size="small"
            >
              {!isMobile && 'התנתק'}
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
