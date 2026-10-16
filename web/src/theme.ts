import { alpha, createTheme, type PaletteMode } from '@mui/material/styles';

const FONT = '"Inter", "Helvetica", "Arial", sans-serif';
export const FONT_DISPLAY = '"Poppins", "Inter", "Helvetica", "Arial", sans-serif';
export const FONT_MONO = FONT; // premium look: one family, tabular numerals via `numeric` below
export const numeric = { fontVariantNumeric: 'tabular-nums' } as const;

// Same palette as the mobile app (mobile/src/theme/colors.ts): deep leaf green on sage.
// `dark` is a green-tinted night variant for the toggle; light is the default.
const TOKENS = {
  dark: {
    bg: '#0b1a12',
    card: '#12261b',
    raised: '#183024',
    line: 'rgba(231,240,234,0.10)',
    text: '#e7f0ea',
    muted: '#9db0a2',
    primary: '#7fd199',
    onPrimary: '#0b1a12',
    secondary: '#4fa56f',
    success: '#7fd199',
    info: '#5fc2b6',
    warning: '#e3b05a',
    error: '#f08a80',
  },
  light: {
    bg: '#e7f0ea',
    card: '#ffffff',
    raised: '#f3f8f5',
    line: '#d5e4da',
    text: '#14532d',
    muted: '#4b5563',
    primary: '#14532d',
    onPrimary: '#ffffff',
    secondary: '#2f6b4f',
    success: '#16a34a',
    info: '#0f766e',
    warning: '#b45309',
    error: '#dc2626',
  },
} as const;

export function buildTheme(mode: PaletteMode) {
  const t = TOKENS[mode];

  return createTheme({
    palette: {
      mode,
      primary: { main: t.primary, contrastText: t.onPrimary },
      secondary: { main: t.secondary },
      info: { main: t.info },
      warning: { main: t.warning },
      error: { main: t.error },
      success: { main: t.success },
      background: { default: t.bg, paper: t.card },
      text: { primary: t.text, secondary: t.muted },
      divider: t.line,
    },
    shape: { borderRadius: 4 }, // sx radius N => N*4px; component radii below are explicit
    typography: {
      fontFamily: FONT,
      h1: { fontFamily: FONT_DISPLAY, fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontFamily: FONT_DISPLAY, fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontFamily: FONT_DISPLAY, fontWeight: 700, letterSpacing: '-0.02em' },
      h4: { fontFamily: FONT_DISPLAY, fontWeight: 600, letterSpacing: '-0.02em' },
      h5: { fontFamily: FONT_DISPLAY, fontWeight: 600, letterSpacing: '-0.015em' },
      h6: { fontFamily: FONT_DISPLAY, fontWeight: 600, letterSpacing: '-0.01em' },
      overline: { fontSize: 13, letterSpacing: 0, textTransform: 'none', lineHeight: 1.5, fontWeight: 500 },
      button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: t.bg, fontVariantNumeric: 'tabular-nums' },
          '*::-webkit-scrollbar': { width: 10, height: 10 },
          '*::-webkit-scrollbar-thumb': { background: alpha(t.muted, 0.35), borderRadius: 8 },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none', backgroundColor: t.card, border: `1px solid ${t.line}`, borderRadius: 16 } },
      },
      MuiCard: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: { root: { backgroundColor: t.card, border: `1px solid ${t.line}`, borderRadius: 20 } },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'transparent', position: 'static' },
        styleOverrides: { root: { backgroundColor: 'transparent', backgroundImage: 'none', color: t.text } },
      },
      MuiDrawer: {
        styleOverrides: { paper: { backgroundColor: t.card, backgroundImage: 'none', borderRight: `1px solid ${t.line}` } },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 16, paddingInline: 20 } },
      },
      MuiIconButton: {
        styleOverrides: { root: { border: `1px solid ${t.line}`, backgroundColor: t.card, '&:hover': { backgroundColor: t.raised } } },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600, borderRadius: 999, border: `1px solid ${t.line}` } },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            backgroundColor: t.raised,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: t.line },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(t.text, 0.3) },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: t.primary, borderWidth: 1 },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            margin: '2px 10px',
            '&.Mui-selected': {
              backgroundColor: t.primary,
              color: t.onPrimary,
              '& .MuiListItemIcon-root': { color: t.onPrimary },
              '&:hover': { backgroundColor: alpha(t.primary, 0.9) },
            },
          },
        },
      },
      MuiListItemIcon: { styleOverrides: { root: { minWidth: 38, color: t.muted } } },
      MuiTabs: { styleOverrides: { indicator: { height: 2, borderRadius: 2, backgroundColor: t.primary } } },
      MuiAlert: { styleOverrides: { root: { border: `1px solid ${t.line}`, borderRadius: 14 } } },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottom: `1px solid ${t.line}`, fontSize: 14 },
          head: { fontSize: 13, fontWeight: 500, color: t.muted, backgroundColor: 'transparent' },
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: { root: { backgroundColor: t.card, border: `1px solid ${t.line}`, borderRadius: 999, padding: 3, gap: 2 } },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            border: 'none',
            borderRadius: '999px !important',
            textTransform: 'none',
            fontWeight: 600,
            color: t.text,
            paddingInline: 18,
            '&.Mui-selected': {
              color: t.onPrimary,
              backgroundColor: t.primary,
              '&:hover': { backgroundColor: alpha(t.primary, 0.9) },
            },
          },
        },
      },
    },
  });
}
