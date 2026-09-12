import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { api, type SupportTicket } from '../api/client';

const STATUS_COLOR: Record<SupportTicket['status'], 'warning' | 'info' | 'success'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
};

export function SupportPage() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.tickets
      .list()
      .then(setTickets)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    if (!subject.trim() || !body.trim()) {
      setMessage('Add a subject and a short description.');
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await api.tickets.create({ subject: subject.trim(), body: body.trim() });
      setSubject('');
      setBody('');
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not submit your ticket.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="h5" sx={{ fontWeight: 800 }} gutterBottom>
        Contact Support
      </Typography>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {message ? <Alert severity="info">{message}</Alert> : null}
          <TextField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <TextField
            label="Details"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            multiline
            minRows={4}
          />
          <Button variant="contained" onClick={submit} disabled={submitting} sx={{ alignSelf: 'flex-start' }}>
            Submit
          </Button>
        </CardContent>
      </Card>

      <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
        Your tickets
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : tickets.length === 0 ? (
        <Typography color="text.secondary">You haven't filed any issues yet.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {tickets.map((t) => (
            <Card key={t.id} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 700 }}>{t.subject}</Typography>
                  <Chip label={t.status.replace('_', ' ')} size="small" color={STATUS_COLOR[t.status]} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {t.body}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
