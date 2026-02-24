import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: '"Heebo", "Arial", sans-serif',
  },
  palette: {
    primary: {
      main: '#1565c0',
      light: '#5e92f3',
      dark: '#003c8f',
    },
    secondary: {
      main: '#ff8f00',
      light: '#ffc046',
      dark: '#c56000',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          textAlign: 'start',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          textAlign: 'start',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          textAlign: 'start',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          right: 0,
          left: 'auto',
          transformOrigin: 'top right',
          textAlign: 'right',
          width: '100%',
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          textAlign: 'right',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          textAlign: 'start',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          textAlign: 'start',
        },
        input: {
          textAlign: 'start',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          textAlign: 'start',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        message: {
          textAlign: 'start',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          textAlign: 'start',
        },
      },
    },
    MuiDialogContentText: {
      styleOverrides: {
        root: {
          textAlign: 'start',
        },
      },
    },
  },
});

export default theme;
