import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import { api, type SupportTicket, type TicketWithUser } from '../../api/client';

const STATUSES: SupportTicket['status'][] = ['open', 'in_progress', 'resolved'];

export function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.admin
      .tickets()
      .then(setTickets)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: SupportTicket['status']) {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    await api.admin.updateTicketStatus(id, status).catch(() => load());
  }

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800 }} gutterBottom>
        Support Tickets Queue
      </Typography>
      {tickets.length === 0 ? (
        <Typography color="text.secondary">No tickets filed yet.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 760 }}>
          {tickets.map((t) => (
            <Card key={t.id} variant="outlined">
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700 }}>{t.subject}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.user?.name ?? 'Unknown'} ({t.user?.email ?? '—'}) ·{' '}
                    {new Date(t.createdAt).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {t.body}
                  </Typography>
                </Box>
                <Select
                  size="small"
                  value={t.status}
                  onChange={(e) => updateStatus(t.id, e.target.value as SupportTicket['status'])}
                  sx={{ minWidth: 140, height: 'fit-content' }}
                >
                  {STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
