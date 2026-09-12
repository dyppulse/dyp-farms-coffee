import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#14235e' }, // navy, matches the mobile app's brand
    secondary: { main: '#166534' }, // farmer green
    background: { default: '#f5f5fb' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
  },
});
