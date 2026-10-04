import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { ThemeProvider, type PaletteMode } from '@mui/material/styles';
import { buildTheme } from '../theme';

const STORAGE_KEY = 'dyp-color-mode';

interface ColorModeValue {
  mode: PaletteMode;
  toggle: () => void;
}

const ColorModeContext = createContext<ColorModeValue>({ mode: 'dark', toggle: () => {} });

function initialMode(): PaletteMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* storage unavailable */
  }
  return 'dark';
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(initialMode);
  const theme = useMemo(() => buildTheme(mode), [mode]);
  const value = useMemo<ColorModeValue>(
    () => ({
      mode,
      toggle: () =>
        setMode((m) => {
          const next = m === 'dark' ? 'light' : 'dark';
          try {
            localStorage.setItem(STORAGE_KEY, next);
          } catch {
            /* storage unavailable */
          }
          return next;
        }),
    }),
    [mode],
  );
  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useColorMode = () => useContext(ColorModeContext);
