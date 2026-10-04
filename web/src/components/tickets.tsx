import Chip from '@mui/material/Chip';
import { alpha, useTheme } from '@mui/material/styles';
import type { TicketPriority, TicketStatus, TicketTeam } from '../api/client';
import type { Accent } from './ui';

const STATUS_ACCENT: Record<TicketStatus, Accent> = { open: 'warning', in_progress: 'info', resolved: 'secondary' };
const PRIORITY_ACCENT: Record<TicketPriority, Accent> = { low: 'secondary', normal: 'info', high: 'warning', urgent: 'error' };

export const label = (s: string) => s.replace('_', ' ');
export const teamLabel = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function Tinted({ text, accent }: { text: string; accent: Accent }) {
  const color = useTheme().palette[accent].main;
  return (
    <Chip
      size="small"
      label={text}
      sx={{ textTransform: 'capitalize', color, bgcolor: alpha(color, 0.12), borderColor: alpha(color, 0.3) }}
    />
  );
}

export const StatusChip = ({ status }: { status: TicketStatus }) => <Tinted text={label(status)} accent={STATUS_ACCENT[status]} />;
export const PriorityChip = ({ priority }: { priority: TicketPriority }) => (
  <Tinted text={priority} accent={PRIORITY_ACCENT[priority]} />
);
export const TeamChip = ({ team }: { team: TicketTeam }) => (
  <Chip size="small" variant="outlined" label={teamLabel(team)} />
);

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
