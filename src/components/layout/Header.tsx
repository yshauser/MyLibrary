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
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
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
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const allNavItems = isAdmin ? [...navItems, ...adminNavItems] : navItems;

  const getTabValue = () => {
    const idx = allNavItems.findIndex((item) => item.path === location.pathname);
    return idx >= 0 ? idx : 0;
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    navigate(allNavItems[newValue].path);
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

        <Typography
          variant={isMobile ? 'h6' : 'h5'}
          component="div"
          sx={{ fontWeight: 700, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          📚 הספרייה שלי
        </Typography>

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
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 240, pt: 1 }} role="presentation">
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
          {isAdmin && (
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
          )}
        </Box>
      </Drawer>
    </AppBar>
  );
}
