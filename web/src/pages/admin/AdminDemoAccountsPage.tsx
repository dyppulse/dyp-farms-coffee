import { useMemo, useState } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Snackbar from '@mui/material/Snackbar';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import { ErrorState } from '../../components/ErrorState';
import { PageHeader } from '../../components/ui';
import { useApiData } from '../../hooks/useApiData';
import { usePageTitle } from '../../hooks/usePageTitle';
import { api, type DemoLogin } from '../../api/client';

const PAGE_SIZE = 25;

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and non-secure pages: fall back to a temporary textarea.
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

const toCsv = (rows: DemoLogin[]) =>
  ['name,email,password,district', ...rows.map((r) => [r.name, r.email, r.password, r.district].map((v) => `"${v.replace(/"/g, '""')}"`).join(','))].join('\n');

function downloadCsv(filename: string, rows: DemoLogin[]) {
  const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

interface GroupProps {
  title: string;
  slug: string;
  rows: DemoLogin[];
  query: string;
  showPasswords: boolean;
  showDistrict: boolean;
  defaultExpanded?: boolean;
  onCopy: (text: string, label: string) => void;
}

function AccountGroup({ title, slug, rows, query, showPasswords, showDistrict, defaultExpanded, onCopy }: GroupProps) {
  const [page, setPage] = useState(0);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => `${r.name} ${r.email} ${r.district}`.toLowerCase().includes(q)) : rows;
  }, [rows, query]);
  const lastPage = Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1);
  const safePage = Math.min(page, lastPage);
  const visible = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const loginLine = (r: DemoLogin) => `${r.email}  ${r.password}`;

  return (
    <Accordion defaultExpanded={defaultExpanded} disableGutters slotProps={{ transition: { unmountOnExit: true } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`${slug}-content`} id={`${slug}-header`}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="h6" component="h2" sx={{ fontSize: 18 }}>
            {title}
          </Typography>
          <Chip size="small" label={query.trim() ? `${filtered.length} of ${rows.length}` : rows.length} />
        </Box>
      </AccordionSummary>
      <AccordionDetails id={`${slug}-content`}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
          <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} disabled={!visible.length} onClick={() => onCopy(visible.map(loginLine).join('\n'), `${visible.length} logins`)}>
            Copy this page
          </Button>
          <Button size="small" variant="outlined" startIcon={<DownloadIcon />} disabled={!filtered.length} onClick={() => downloadCsv(`demo-${slug}.csv`, filtered)}>
            Download CSV ({filtered.length})
          </Button>
        </Box>
        <TableContainer>
          <Table size="small" aria-label={`${title} accounts`}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                {showDistrict ? <TableCell>District</TableCell> : null}
                <TableCell>Email</TableCell>
                <TableCell>Password</TableCell>
                <TableCell align="right">Copy</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((r) => (
                <TableRow key={r.email} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.name}</TableCell>
                  {showDistrict ? <TableCell>{r.district}</TableCell> : null}
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>{r.email}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>{showPasswords ? r.password : '••••••••••••'}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton size="small" aria-label={`Copy email for ${r.name}`} onClick={() => onCopy(r.email, 'Email')}>
                      <ContentCopyIcon fontSize="inherit" />
                    </IconButton>
                    <Button size="small" onClick={() => onCopy(loginLine(r), `Login for ${r.name}`)} aria-label={`Copy login for ${r.name}`}>
                      Login
                    </Button>
                    <Button size="small" onClick={() => onCopy(r.password, 'Password')} aria-label={`Copy password for ${r.name}`}>
                      Password
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!visible.length ? (
                <TableRow>
                  <TableCell colSpan={showDistrict ? 5 : 4} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                    No accounts match.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filtered.length}
          page={safePage}
          onPageChange={(_, next) => setPage(next)}
          rowsPerPage={PAGE_SIZE}
          rowsPerPageOptions={[PAGE_SIZE]}
        />
      </AccordionDetails>
    </Accordion>
  );
}

export function AdminDemoAccountsPage() {
  usePageTitle('Demo accounts');
  const { data, loading, error, reload } = useApiData(() => api.admin.demoAccounts());
  const [query, setQuery] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function onCopy(text: string, label: string) {
    setToast((await copyText(text)) ? `${label} copied` : 'Could not copy. Select the text and copy it by hand.');
  }

  return (
    <Box>
      <PageHeader title="Demo accounts" subtitle="Test logins for handing out to testers and for your own checks. Sign in with these on the web app or the mobile app." />

      <Alert severity="warning" sx={{ mb: 2 }}>
        These are test accounts. Anyone who has a login can act as that user, including placing bids. Remove the demo data before a real launch.
      </Alert>

      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
          <CircularProgress aria-label="Loading demo accounts" />
        </Box>
      ) : null}

      {data ? (
        data.counts.farmers + data.counts.buyers + data.counts.tourists === 0 ? (
          <Alert severity="info">
            No demo accounts on this server. Set SEED_DEMO_DATA=true on the API and restart it to load them.
          </Alert>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
              <TextField
                size="small"
                placeholder="Search name, email or district"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                sx={{ minWidth: { xs: '100%', sm: 340 } }}
                slotProps={{
                  htmlInput: { 'aria-label': 'Search accounts' },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <FormControlLabel control={<Switch checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)} />} label="Show passwords" />
            </Box>

            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <AccountGroup title="Farmers" slug="farmers" rows={data.farmers} query={query} showPasswords={showPasswords} showDistrict defaultExpanded onCopy={onCopy} />
              <AccountGroup title="Buyers (roasters)" slug="buyers" rows={data.buyers} query={query} showPasswords={showPasswords} showDistrict={false} onCopy={onCopy} />
              <AccountGroup title="Tourists" slug="tourists" rows={data.tourists} query={query} showPasswords={showPasswords} showDistrict={false} onCopy={onCopy} />
            </Box>
          </>
        )
      ) : null}

      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast(null)} message={toast} />
    </Box>
  );
}
