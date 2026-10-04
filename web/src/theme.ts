import { alpha, createTheme, type PaletteMode } from '@mui/material/styles';

const FONT = '"Manrope", "Helvetica", "Arial", sans-serif';
export const FONT_DISPLAY = FONT;
export const FONT_MONO = FONT; // premium look: one family, tabular numerals via `numeric` below
export const numeric = { fontVariantNumeric: 'tabular-nums' } as const;

const TOKENS = {
  dark: {
    bg: '#0c0c0c',
    card: '#161615',
    raised: '#1d1d1b',
    line: 'rgba(255,255,255,0.07)',
    text: '#f2efe6',
    muted: '#8d8a82',
    primary: '#e8dfbd', // cream
    onPrimary: '#1a1a14',
    secondary: '#9ccf9e',
    info: '#9eb6e6',
    warning: '#e3c36b',
    error: '#e48c7d',
  },
  light: {
    bg: '#ecebe6',
    card: '#ffffff',
    raised: '#f6f5f1',
    line: 'rgba(0,0,0,0.08)',
    text: '#14140f',
    muted: '#77756c',
    primary: '#1a1a17', // ink
    onPrimary: '#f5f2e6',
    secondary: '#3f7d4e',
    info: '#4a68b0',
    warning: '#b8892a',
    error: '#c4513f',
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
      success: { main: t.secondary },
      background: { default: t.bg, paper: t.card },
      text: { primary: t.text, secondary: t.muted },
      divider: t.line,
    },
    shape: { borderRadius: 4 }, // sx radius N => N*4px; component radii below are explicit
    typography: {
      fontFamily: FONT,
      h1: { fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontWeight: 700, letterSpacing: '-0.02em' },
      h4: { fontWeight: 600, letterSpacing: '-0.02em' },
      h5: { fontWeight: 600, letterSpacing: '-0.015em' },
      h6: { fontWeight: 600, letterSpacing: '-0.01em' },
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
        styleOverrides: { root: { borderRadius: 999, paddingInline: 20 } },
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
