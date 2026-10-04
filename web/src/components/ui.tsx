import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import { alpha, useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';

export type Accent = 'primary' | 'secondary' | 'info' | 'warning' | 'error';

export function PageHeader({ title, subtitle }: { eyebrow?: string; title: string; subtitle?: ReactNode }) {
  return (
    <Box sx={{ mb: { xs: 3, md: 4 } }}>
      <Typography variant="h4" sx={{ fontSize: { xs: 26, md: 32 } }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}

/** Matte card with a large title and a small ↗ link, like the reference dashboard. */
export function Panel({
  title,
  children,
  to,
  action,
}: {
  title?: string;
  children: ReactNode;
  to?: string;
  action?: ReactNode;
}) {
  return (
    <Box sx={{ p: 3, borderRadius: 5, bgcolor: 'background.paper', border: 1, borderColor: 'divider', height: '100%' }}>
      {title || to || action ? (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="h6" sx={{ fontSize: 20 }}>
            {title}
          </Typography>
          {action ??
            (to ? (
              <Box
                component={RouterLink}
                to={to}
                aria-label={`Open ${title}`}
                sx={{ color: 'text.secondary', display: 'flex', '&:hover': { color: 'text.primary' } }}
              >
                <NorthEastIcon fontSize="small" />
              </Box>
            ) : null)}
        </Box>
      ) : null}
      {children}
    </Box>
  );
}

/** One headline figure: quiet label, big number, tiny accent dot. */
export function StatTile({
  label,
  value,
  accent = 'primary',
  icon,
}: {
  label: string;
  value: string | number;
  accent?: Accent;
  icon?: ReactNode;
  dense?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <Box sx={{ p: 2.25, borderRadius: 4, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'text.secondary' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{label}</Typography>
        <Box sx={{ display: 'flex', color: palette[accent].main, '& svg': { fontSize: 18 } }}>{icon}</Box>
      </Box>
      <Typography sx={{ mt: 0.75, fontWeight: 700, fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{value}</Typography>
    </Box>
  );
}

export interface Slice {
  label: string;
  value: number;
  accent: Accent;
}

/** Thin ring with a centred total and a legend. */
export function DonutChart({ slices, centerLabel }: { slices: Slice[]; centerLabel: string }) {
  const { palette } = useTheme();
  const total = slices.reduce((s, x) => s + x.value, 0);
  const R = 54;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
      <Box sx={{ position: 'relative', width: 150, height: 150, flexShrink: 0 }}>
        <svg viewBox="0 0 140 140" width="150" height="150" role="img" aria-label={centerLabel}>
          <circle cx="70" cy="70" r={R} fill="none" stroke={alpha(palette.text.primary, 0.08)} strokeWidth="10" />
          {total > 0
            ? slices.map((s) => {
                const len = (s.value / total) * C;
                const dash = Math.max(len - 3, 0);
                const el = (
                  <circle
                    key={s.label}
                    cx="70"
                    cy="70"
                    r={R}
                    fill="none"
                    stroke={palette[s.accent].main}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${C - dash}`}
                    strokeDashoffset={-offset}
                    transform="rotate(-90 70 70)"
                  />
                );
                offset += len;
                return el;
              })
            : null}
        </svg>
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 32, lineHeight: 1, letterSpacing: '-0.02em' }}>{total}</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{centerLabel}</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.1 }}>
        {slices.map((s) => (
          <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: palette[s.accent].main }} />
            <Typography variant="body2" sx={{ minWidth: 92, textTransform: 'capitalize' }}>
              {s.label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {s.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export interface Bar {
  label: string;
  value: number;
  display?: string;
}

const TICKS = 38;

/** Tick-mark bars with a percentage — the "Fleet distribution" look. */
export function BarChart({ bars, empty }: { bars: Bar[]; accent?: Accent; empty?: string }) {
  const { palette } = useTheme();
  const max = Math.max(...bars.map((b) => b.value), 0);
  if (!bars.length || max === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {empty ?? 'No data yet.'}
      </Typography>
    );
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6 }}>
      {bars.map((b) => {
        const pct = Math.round((b.value / max) * 100);
        const lit = Math.max(1, Math.round((pct / 100) * TICKS));
        return (
          <Box key={b.label} sx={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 1.1fr) 52px 2fr 38px', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
              {b.label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
              {b.display ?? b.value}
            </Typography>
            <Box sx={{ display: 'flex', gap: '2px', height: 16 }} aria-hidden>
              {Array.from({ length: TICKS }, (_, i) => (
                <Box
                  key={i}
                  sx={{ flex: 1, borderRadius: 1, bgcolor: i < lit ? palette.text.primary : alpha(palette.text.primary, 0.14) }}
                />
              ))}
            </Box>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', textAlign: 'right' }}>{pct}%</Typography>
          </Box>
        );
      })}
    </Box>
  );
}

/** Slim gradient gauge with a floating value bubble. */
export function Gauge({ value, label, caption }: { value: number; label: string; caption: string }) {
  const pct = Math.min(Math.max(value, 0), 100);
  const { palette } = useTheme();
  return (
    <Box sx={{ pt: 4 }}>
      <Box sx={{ position: 'relative', height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${palette.error.main}, ${palette.warning.main}, ${palette.secondary.main})` }}>
        <Box sx={{ position: 'absolute', left: `${pct}%`, top: '50%', transform: 'translate(-50%, -50%)' }}>
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              px: 1.25,
              py: 0.25,
              borderRadius: 999,
              bgcolor: palette.text.primary,
              color: palette.background.default,
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </Box>
          <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: palette.text.primary, border: `3px solid ${palette.background.paper}` }} />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.25, fontSize: 12, color: 'text.secondary' }}>
        <span>0%</span>
        <span>100%</span>
      </Box>
      <Typography variant="body2" sx={{ mt: 1.5, textAlign: 'center', fontWeight: 500 }}>
        {caption}
      </Typography>
    </Box>
  );
}
