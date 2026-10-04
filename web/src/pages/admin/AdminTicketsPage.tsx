import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { PageHeader, Panel } from '../../components/ui';
import { plainText } from '../../components/RichText';
import { PriorityChip, StatusChip, TeamChip, fmtDate } from '../../components/tickets';
import { api, type TicketWithUser } from '../../api/client';

type Filter = 'all' | 'open' | 'in_progress' | 'resolved' | 'escalated';

const isEscalated = (t: TicketWithUser) => !!t.team || !!t.escalationRequestedAt;

export function AdminTicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.admin
      .tickets()
      .then(setTickets)
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo<Record<Filter, number>>(
    () => ({
      all: tickets.length,
      open: tickets.filter((t) => t.status === 'open').length,
      in_progress: tickets.filter((t) => t.status === 'in_progress').length,
      resolved: tickets.filter((t) => t.status === 'resolved').length,
      escalated: tickets.filter(isEscalated).length,
    }),
    [tickets],
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets
      .filter((t) => (filter === 'all' ? true : filter === 'escalated' ? isEscalated(t) : t.status === filter))
      .filter(
        (t) =>
          !q ||
          t.subject.toLowerCase().includes(q) ||
          plainText(t.body).toLowerCase().includes(q) ||
          (t.user?.name ?? '').toLowerCase().includes(q) ||
          (t.user?.email ?? '').toLowerCase().includes(q),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [tickets, filter, query]);

  const tabs: { id: Filter; text: string }[] = [
    { id: 'all', text: 'All' },
    { id: 'open', text: 'Open' },
    { id: 'in_progress', text: 'In progress' },
    { id: 'resolved', text: 'Resolved' },
    { id: 'escalated', text: 'Escalated' },
  ];

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <PageHeader title="Support Tickets" subtitle={`${tickets.length} on file · ${counts.open} open · ${counts.escalated} escalated`} />

      <Panel
        title="Tickets"
        action={
          <Box sx={{ display: 'flex', gap: 0.5, p: 0.5, borderRadius: 999, border: 1, borderColor: 'divider', flexWrap: 'wrap' }}>
            {tabs.map((t) => (
              <Box
                key={t.id}
                onClick={() => setFilter(t.id)}
                sx={{
                  px: 1.75,
                  py: 0.6,
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  bgcolor: filter === t.id ? 'primary.main' : 'transparent',
                  color: filter === t.id ? 'primary.contrastText' : 'text.primary',
                }}
              >
                {t.text}{' '}
                <Box component="span" sx={{ opacity: 0.6, ml: 0.5 }}>
                  {counts[t.id]}
                </Box>
              </Box>
            ))}
          </Box>
        }
      >
        <TextField
          size="small"
          placeholder="Search subject, message or requester"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ mb: 2, width: { xs: '100%', sm: 360 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        <Box sx={{ overflowX: 'auto', mx: -1 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ticket</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Requester</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Team</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Filed</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shown.map((t) => (
                <TableRow key={t.id} hover onClick={() => navigate(`/admin/tickets/${t.id}`)} sx={{ cursor: 'pointer' }}>
                  <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>#{t.id.slice(0, 8)}</TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography noWrap sx={{ fontWeight: 600, fontSize: 14 }}>
                        {t.subject}
                      </Typography>
                      {t._count?.comments ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: 'text.secondary', fontSize: 12 }}>
                          <ChatBubbleOutlineIcon sx={{ fontSize: 14 }} /> {t._count.comments}
                        </Box>
                      ) : null}
                    </Box>
                    <Typography noWrap variant="body2" color="text.secondary">
                      {plainText(t.body)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {t.user?.name ?? 'Unknown'}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {t.user?.email ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <PriorityChip priority={t.priority} />
                  </TableCell>
                  <TableCell>
                    {t.team ? (
                      <TeamChip team={t.team} />
                    ) : t.escalationRequestedAt ? (
                      <Chip size="small" color="warning" variant="outlined" icon={<TrendingUpIcon />} label="Escalation requested" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={t.status} />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>{fmtDate(t.createdAt)}</TableCell>
                </TableRow>
              ))}
              {!shown.length ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ color: 'text.secondary' }}>
                    {tickets.length ? 'No tickets match this view.' : 'No tickets filed yet.'}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Box>
      </Panel>
    </Box>
  );
}
