import { useState, useRef, useCallback } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  LibraryBooks as LibraryIcon,
  BarChart as StatsIcon,
  History as LogIcon,
  FormatListBulleted as WishlistIcon,
  VpnKey as KeyIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { label: 'ספרייה', path: '/', icon: <LibraryIcon /> },
  { label: 'סטטיסטיקה', path: '/dashboard', icon: <StatsIcon /> },
  { label: 'רשימת משאלות', path: '/wishlist', icon: <WishlistIcon /> },
];

const adminNavItems = [
  { label: 'יומן פעילות', path: '/log', icon: <LogIcon /> },
];

export default function Header() {
  const { isAdmin, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '';
  const [versionSnackOpen, setVersionSnackOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTitleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setVersionSnackOpen(true);
    }, 600);
  }, []);

  const handleTitleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const allNavItems = isAdmin ? [...navItems, ...adminNavItems] : navItems;

  const getTabValue = () => {
    const idx = allNavItems.findIndex((item) => item.path === location.pathname);
    return idx >= 0 ? idx : 0;
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    navigate(allNavItems[newValue].path);
  };

  const handleLogin = async () => {
    setLoginError('');
    setLoginLoading(true);
    try {
      await login(email, password);
      setLoginOpen(false);
      setEmail('');
      setPassword('');
    } catch {
      setLoginError('שם משתמש או סיסמה שגויים');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLoginKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleLogout = async () => {
    setDrawerOpen(false);
    await logout();
    navigate('/');
  };

  const handleNavClick = (path: string) => {
    setDrawerOpen(false);
    navigate(path);
  };

  return (
    <>
    <AppBar position="sticky" sx={{ bgcolor: 'primary.main' }}>
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        {isMobile && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Tooltip title={version ? `v${version}` : ''} arrow>
          <Typography
            variant={isMobile ? 'h6' : 'h5'}
            component="div"
            sx={{ fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}
            onClick={() => navigate('/')}
            onTouchStart={handleTitleTouchStart}
            onTouchEnd={handleTitleTouchEnd}
            onContextMenu={(e) => e.preventDefault()}
          >
            📚 הספרייה שלי
          </Typography>
        </Tooltip>

        {!isMobile && (
          <Tabs
            value={getTabValue()}
            onChange={handleTabChange}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ mx: 2 }}
          >
            {allNavItems.map((item) => (
              <Tab key={item.path} label={item.label} />
            ))}
          </Tabs>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {!isMobile && isAdmin && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="הוספת ספר">
              <IconButton color="inherit" onClick={() => navigate('/add')}>
                <AddIcon />
              </IconButton>
            </Tooltip>
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
            <Tooltip title="התנתק">
              <IconButton color="inherit" onClick={handleLogout}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        {!isMobile && !isAdmin && (
          <Tooltip title="כניסת מנהל">
            <IconButton
              color="inherit"
              onClick={() => setLoginOpen(true)}
              sx={{ opacity: 0.4, '&:hover': { opacity: 1 } }}
            >
              <KeyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 240, pt: 1, display: 'flex', flexDirection: 'column', height: '100%' }} role="presentation">
          <List>
            {allNavItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavClick(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          {isAdmin ? (
            <>
              <Divider />
              <List>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleNavClick('/add')}>
                    <ListItemIcon><AddIcon /></ListItemIcon>
                    <ListItemText primary="הוספת ספר" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleNavClick('/export')}>
                    <ListItemIcon><ExportIcon /></ListItemIcon>
                    <ListItemText primary="ייצוא" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleNavClick('/import')}>
                    <ListItemIcon><ImportIcon /></ListItemIcon>
                    <ListItemText primary="ייבוא" />
                  </ListItemButton>
                </ListItem>
                <Divider />
                <ListItem disablePadding>
                  <ListItemButton onClick={handleLogout}>
                    <ListItemIcon><LogoutIcon /></ListItemIcon>
                    <ListItemText primary="התנתק" />
                  </ListItemButton>
                </ListItem>
              </List>
            </>
          ) : (
            <>
              <Divider />
              <List>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => { setDrawerOpen(false); setLoginOpen(true); }}>
                    <ListItemIcon><KeyIcon /></ListItemIcon>
                    <ListItemText primary="כניסת מנהל" />
                  </ListItemButton>
                </ListItem>
              </List>
            </>
          )}
        </Box>
        {version && (
          <Box sx={{ mt: 'auto', p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.disabled">
              v{version}
            </Typography>
          </Box>
        )}
      </Drawer>
    </AppBar>

      <Dialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>כניסת מנהל</DialogTitle>
        <DialogContent>
          {loginError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loginError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="אימייל"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleLoginKeyDown}
          />
          <TextField
            margin="dense"
            label="סיסמה"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleLoginKeyDown}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoginOpen(false)}>ביטול</Button>
          <Button
            onClick={handleLogin}
            variant="contained"
            disabled={loginLoading || !email || !password}
          >
            {loginLoading ? 'מתחבר...' : 'התחבר'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={versionSnackOpen}
        autoHideDuration={2000}
        onClose={() => setVersionSnackOpen(false)}
        message={`v${version}`}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
