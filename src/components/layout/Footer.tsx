import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { VpnKey as KeyIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

export default function Footer() {
  const { isAdmin, login } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      setLoginOpen(false);
      setEmail('');
      setPassword('');
    } catch {
      setError('שם משתמש או סיסמה שגויים');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <>
      <Box
        component="footer"
        sx={{
          py: 2,
          px: 3,
          mt: 'auto',
          bgcolor: 'grey.100',
          borderTop: '1px solid',
          borderColor: 'grey.300',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          הספרייה שלי © {new Date().getFullYear()}
        </Typography>
        {!isAdmin && (
          <Tooltip title="כניסת מנהל">
            <IconButton
              size="small"
              color="default"
              onClick={() => setLoginOpen(true)}
              sx={{ opacity: 0.4, '&:hover': { opacity: 1 } }}
            >
              <KeyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Dialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>כניסת מנהל</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
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
            onKeyDown={handleKeyDown}
          />
          <TextField
            margin="dense"
            label="סיסמה"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoginOpen(false)}>ביטול</Button>
          <Button
            onClick={handleLogin}
            variant="contained"
            disabled={loading || !email || !password}
          >
            {loading ? 'מתחבר...' : 'התחבר'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
