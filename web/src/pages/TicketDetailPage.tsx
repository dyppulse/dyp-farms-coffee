import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { alpha, useTheme } from '@mui/material/styles';
import { Panel } from '../components/ui';
import { PriorityChip, StatusChip, TeamChip, fmtDate, label, teamLabel } from '../components/tickets';
import {
  TICKET_PRIORITIES,
  TICKET_TEAMS,
  api,
  type TicketComment,
  type TicketDetail,
  type TicketPriority,
  type TicketStatus,
  type TicketTeam,
} from '../api/client';

const STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved'];

function Meta({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>{name}</Typography>
      <Box sx={{ fontSize: 14, fontWeight: 500 }}>{children}</Box>
    </Box>
  );
}

function Entry({ entry }: { entry: TicketComment }) {
  const { palette } = useTheme();
  if (entry.kind === 'event') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 0.5 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'text.secondary', opacity: 0.6, flexShrink: 0 }} />
        <Typography variant="body2" color="text.secondary">
          <b style={{ fontWeight: 600, color: palette.text.primary }}>{entry.authorName}</b> · {entry.body}{' '}
          <span style={{ opacity: 0.7 }}>· {fmtDate(entry.createdAt)}</span>
        </Typography>
      </Box>
    );
  }
  const staff = entry.authorRole === 'admin';
  return (
    <Box sx={{ display: 'flex', gap: 1.5 }}>
      <Avatar
        sx={{
          width: 34,
          height: 34,
          fontSize: 14,
          fontWeight: 700,
          bgcolor: staff ? 'primary.main' : alpha(palette.text.primary, 0.12),
          color: staff ? 'primary.contrastText' : 'text.primary',
        }}
      >
        {entry.authorName[0]?.toUpperCase()}
      </Avatar>
      <Box
        sx={{
          flex: 1,
          p: 2,
          borderRadius: 4,
          border: 1,
          borderColor: entry.internal ? alpha(palette.warning.main, 0.5) : 'divider',
          borderStyle: entry.internal ? 'dashed' : 'solid',
          bgcolor: entry.internal ? alpha(palette.warning.main, 0.07) : 'action.hover',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75, flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{entry.authorName}</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            {staff ? 'Tech ops' : 'Reporter'} · {fmtDate(entry.createdAt)}
          </Typography>
          {entry.internal ? (
            <Typography sx={{ fontSize: 12, color: 'warning.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LockOutlinedIcon sx={{ fontSize: 14 }} /> Internal note
            </Typography>
          ) : null}
        </Box>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
          {entry.body}
        </Typography>
      </Box>
    </Box>
  );
}

/** One ticket: description, comment thread, composer and a side panel of controls.
 * `staff` unlocks internal notes, status/priority edits and team escalation; reporters
 * instead get a "request escalation" action. */
export function TicketDetailPage({ staff = false }: { staff?: boolean }) {
  const { id = '' } = useParams();
  const backTo = staff ? '/admin/tickets' : '/support';

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [dialog, setDialog] = useState<'escalate' | 'request' | null>(null);
  const [team, setTeam] = useState<TicketTeam>('payments');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    return (staff ? api.admin.ticket(id) : api.tickets.get(id))
      .then((t) => {
        setTicket(t);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load this ticket'))
      .finally(() => setLoading(false));
  }, [id, staff]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    await run(() => (staff ? api.admin.commentOnTicket(id, text.trim(), internal) : api.tickets.comment(id, text.trim())));
    setText('');
    setInternal(false);
    setSending(false);
  }

  if (loading) return <CircularProgress />;
  if (!ticket) {
    return (
      <Box>
        <Alert severity="error">{error ?? 'Ticket not found'}</Alert>
        <Button component={RouterLink} to={backTo} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Back to tickets
        </Button>
      </Box>
    );
  }

  const comments = ticket.comments.filter((c) => c.kind === 'comment' && !c.internal).length;
  const closed = ticket.status === 'resolved';

  return (
    <Box>
      <Button component={RouterLink} to={backTo} startIcon={<ArrowBackIcon />} sx={{ mb: 2, ml: -1.5, color: 'text.secondary' }}>
        {staff ? 'All tickets' : 'Support'}
      </Button>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: 24, md: 30 } }}>
          {ticket.subject}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 3 }}>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mr: 0.5 }}>#{ticket.id.slice(0, 8)}</Typography>
        <StatusChip status={ticket.status} />
        <PriorityChip priority={ticket.priority} />
        {ticket.team ? <TeamChip team={ticket.team} /> : null}
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
      {ticket.escalationRequestedAt ? (
        <Alert severity="warning" icon={<TrendingUpIcon />} sx={{ mb: 2 }}>
          {staff
            ? 'The reporter has asked for this ticket to be escalated.'
            : 'You asked for this ticket to be escalated — the team will pick a destination shortly.'}
        </Alert>
      ) : null}
      {ticket.team && !staff ? (
        <Alert severity="info" icon={<TrendingUpIcon />} sx={{ mb: 2 }}>
          This ticket is now with the {teamLabel(ticket.team)} team.
        </Alert>
      ) : null}

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, alignItems: 'start' }}>
        {/* Thread */}
        <Panel title={`Conversation · ${comments} ${comments === 1 ? 'comment' : 'comments'}`}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Avatar sx={{ width: 34, height: 34, fontSize: 14, fontWeight: 700 }}>
                {ticket.user?.name?.[0]?.toUpperCase() ?? '?'}
              </Avatar>
              <Box sx={{ flex: 1, p: 2, borderRadius: 4, border: 1, borderColor: 'divider' }}>
                <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                  {ticket.user?.name ?? 'Reporter'}{' '}
                  <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 400 }}>
                    · opened {fmtDate(ticket.createdAt)}
                  </Typography>
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.75, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {ticket.body}
                </Typography>
              </Box>
            </Box>

            {ticket.comments.map((c) => (
              <Entry key={c.id} entry={c} />
            ))}

            <Divider />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <TextField
                multiline
                minRows={3}
                placeholder={staff && internal ? 'Write an internal note (not visible to the reporter)…' : 'Write a reply…'}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {staff ? (
                  <FormControlLabel
                    control={<Checkbox size="small" checked={internal} onChange={(e) => setInternal(e.target.checked)} />}
                    label={<Typography variant="body2">Internal note — hidden from the reporter</Typography>}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {closed ? 'Replying will reopen this ticket.' : 'Tech ops will be notified.'}
                  </Typography>
                )}
                <Button variant="contained" onClick={send} disabled={sending || !text.trim()}>
                  {staff && internal ? 'Add note' : 'Send reply'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Panel>

        {/* Controls */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Panel title="Details">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {staff ? (
                <>
                  <Meta name="Status">
                    <Select
                      fullWidth
                      size="small"
                      value={ticket.status}
                      disabled={busy}
                      onChange={(e) => run(() => api.admin.updateTicket(id, { status: e.target.value as TicketStatus }))}
                      sx={{ textTransform: 'capitalize' }}
                    >
                      {STATUSES.map((s) => (
                        <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                          {label(s)}
                        </MenuItem>
                      ))}
                    </Select>
                  </Meta>
                  <Meta name="Priority">
                    <Select
                      fullWidth
                      size="small"
                      value={ticket.priority}
                      disabled={busy}
                      onChange={(e) => run(() => api.admin.updateTicket(id, { priority: e.target.value as TicketPriority }))}
                      sx={{ textTransform: 'capitalize' }}
                    >
                      {TICKET_PRIORITIES.map((p) => (
                        <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>
                          {p}
                        </MenuItem>
                      ))}
                    </Select>
                  </Meta>
                </>
              ) : null}
              <Meta name="Reporter">
                {ticket.user?.name ?? 'Unknown'}
                <Typography variant="body2" color="text.secondary">
                  {ticket.user?.email}
                </Typography>
              </Meta>
              <Meta name="Owning team">{ticket.team ? teamLabel(ticket.team) : 'Not escalated'}</Meta>
              <Meta name="Opened">{fmtDate(ticket.createdAt)}</Meta>
              <Meta name="Last updated">{fmtDate(ticket.updatedAt)}</Meta>
              {ticket.escalatedAt ? <Meta name="Escalated">{fmtDate(ticket.escalatedAt)}</Meta> : null}
            </Box>
          </Panel>

          <Panel title="Escalation">
            {staff ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Hand this ticket to a specialist team. The reporter is notified and the move is logged.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<TrendingUpIcon />}
                  disabled={closed}
                  onClick={() => {
                    setTeam(ticket.team ?? 'payments');
                    setPriority(ticket.priority);
                    setNote('');
                    setDialog('escalate');
                  }}
                >
                  {ticket.team ? 'Re-escalate' : 'Escalate to team'}
                </Button>
                {closed ? <Typography variant="caption" color="text.secondary">Reopen the ticket to escalate it.</Typography> : null}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Not getting anywhere? Ask tech ops to escalate this to a specialist team.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<TrendingUpIcon />}
                  disabled={closed || !!ticket.escalationRequestedAt}
                  onClick={() => {
                    setNote('');
                    setDialog('request');
                  }}
                >
                  {ticket.escalationRequestedAt ? 'Escalation requested' : 'Request escalation'}
                </Button>
              </Box>
            )}
          </Panel>
        </Box>
      </Box>

      {/* Staff: pick the team */}
      <Dialog open={dialog === 'escalate'} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>Escalate ticket</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField select label="Team" value={team} onChange={(e) => setTeam(e.target.value as TicketTeam)}>
            {TICKET_TEAMS.map((t) => (
              <MenuItem key={t} value={t}>
                {teamLabel(t)}
              </MenuItem>
            ))}
          </TextField>
          <TextField select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
            {TICKET_PRIORITIES.map((p) => (
              <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>
                {p}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Handover note (optional)" multiline minRows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDialog(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={busy}
            onClick={async () => {
              await run(() => api.admin.escalateTicket(id, { team, priority, note: note.trim() || undefined }));
              setDialog(null);
            }}
          >
            Escalate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reporter: say why */}
      <Dialog open={dialog === 'request'} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>Request escalation</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <TextField
            autoFocus
            fullWidth
            label="Why does this need escalating?"
            multiline
            minRows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDialog(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={busy || !note.trim()}
            onClick={async () => {
              await run(() => api.tickets.requestEscalation(id, note.trim()));
              setDialog(null);
            }}
          >
            Send request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
