import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';
import { PageHeader } from '../components/ui';
import { RichEditor } from '../components/LazyRichTextEditor';
import { plainText } from '../components/RichText';
import { StatusChip, TeamChip } from '../components/tickets';
import { api, type SupportTicket } from '../api/client';

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
    if (!subject.trim() || !plainText(body)) {
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
    <Box sx={{ maxWidth: 760, mx: 'auto' }}>
      <PageHeader title="Contact Support" subtitle="Describe the problem — tech ops will reply here." />

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {message ? <Alert severity="info">{message}</Alert> : null}
          <TextField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <RichEditor value={body} onChange={setBody} placeholder="Describe the problem — steps, what you expected, what happened…" />
          <Button variant="contained" onClick={submit} disabled={submitting} sx={{ alignSelf: 'flex-start' }}>
            Submit
          </Button>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        Your tickets
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : tickets.length === 0 ? (
        <Typography color="text.secondary">You haven't filed any issues yet.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {tickets.map((t) => (
            <Card key={t.id} variant="outlined" sx={{ '&:hover': { borderColor: 'text.secondary' } }}>
              <CardActionArea component={RouterLink} to={`/support/${t.id}`}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 700 }}>{t.subject}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0 }}>
                      {t.team ? <TeamChip team={t.team} /> : null}
                      <StatusChip status={t.status} />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {plainText(t.body)}
                  </Typography>
                  {t._count?.comments ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, color: 'text.secondary', fontSize: 13 }}>
                      <ChatBubbleOutlineIcon sx={{ fontSize: 15 }} /> {t._count.comments}{' '}
                      {t._count.comments === 1 ? 'reply' : 'replies'}
                    </Box>
                  ) : null}
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
