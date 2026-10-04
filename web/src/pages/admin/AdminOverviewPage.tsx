import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ScaleOutlinedIcon from '@mui/icons-material/ScaleOutlined';
import GavelIcon from '@mui/icons-material/Gavel';
import AgricultureOutlinedIcon from '@mui/icons-material/AgricultureOutlined';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { alpha, useTheme } from '@mui/material/styles';
import { FarmsMap, farmCenter } from '../../components/FarmsMap';
import { BarChart, Gauge, PageHeader, Panel, StatTile, type Accent } from '../../components/ui';
import { api, type AdminStats, type FarmWithOwner, type TicketWithUser } from '../../api/client';

interface Activity {
  id: string;
  at: string;
  accent: Accent;
  text: string;
}

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 60 / 24)}d ago`;
}

function ActivityFeed({ items }: { items: Activity[] }) {
  const { palette } = useTheme();
  if (!items.length) return <Typography variant="body2" color="text.secondary">Nothing yet.</Typography>;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
      {items.map((a) => (
        <Box key={a.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Box sx={{ mt: '7px', width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: palette[a.accent].main }} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>{a.text}</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{timeAgo(a.at)}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

type FarmFilter = 'all' | 'mapped' | 'pins';

function FarmsList({
  farms,
  selectedId,
  onSelect,
}: {
  farms: FarmWithOwner[];
  selectedId?: string;
  onSelect: (farm: FarmWithOwner) => void;
}) {
  const { palette } = useTheme();
  const [filter, setFilter] = useState<FarmFilter>('all');
  const shown = farms.filter((f) => filter === 'all' || (filter === 'mapped') === f.boundary.length >= 3);
  const tabs: { id: FarmFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'mapped', label: 'Mapped' },
    { id: 'pins', label: 'Pins' },
  ];

  return (
    <Panel
      title="Farms"
      action={
        <Box sx={{ display: 'flex', gap: 0.5, p: 0.5, borderRadius: 999, border: 1, borderColor: 'divider' }}>
          {tabs.map((t) => (
            <Box
              key={t.id}
              onClick={() => setFilter(t.id)}
              sx={{
                px: 2,
                py: 0.6,
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                bgcolor: filter === t.id ? 'primary.main' : 'transparent',
                color: filter === t.id ? 'primary.contrastText' : 'text.primary',
              }}
            >
              {t.label}
            </Box>
          ))}
        </Box>
      }
    >
      <Box sx={{ overflowX: 'auto', mx: -1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Farm</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell align="right">Size</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Type</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map((f) => {
              const c = farmCenter(f);
              const active = f.id === selectedId;
              return (
                <TableRow
                  key={f.id}
                  hover
                  onClick={() => onSelect(f)}
                  sx={{ cursor: 'pointer', bgcolor: active ? alpha(palette.text.primary, 0.06) : undefined }}
                >
                  <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{f.name}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{f.owner?.name ?? 'Unknown'}</TableCell>
                  <TableCell align="right">{f.sizeHectares ? `${f.sizeHectares} ha` : '—'}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                    {c.lat.toFixed(3)}, {c.lng.toFixed(3)}
                  </TableCell>
                  <TableCell>{f.boundary.length >= 3 ? 'Boundary' : 'Pin'}</TableCell>
                </TableRow>
              );
            })}
            {!shown.length ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ color: 'text.secondary' }}>No farms in this view.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Box>
    </Panel>
  );
}

export function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [farms, setFarms] = useState<FarmWithOwner[]>([]);
  const [tickets, setTickets] = useState<TicketWithUser[]>([]);
  const [selected, setSelected] = useState<FarmWithOwner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.admin.stats(), api.admin.farms(), api.admin.tickets()])
      .then(([s, f, t]) => {
        setStats(s);
        setFarms(f);
        setTickets(t);
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const activity = useMemo<Activity[]>(
    () =>
      [
        ...farms.map<Activity>((f) => ({ id: `farm-${f.id}`, at: f.createdAt, accent: 'secondary', text: `Farm registered — ${f.name}` })),
        ...tickets.map<Activity>((t) => ({
          id: `ticket-${t.id}`,
          at: t.createdAt,
          accent: t.status === 'resolved' ? 'secondary' : 'warning',
          text: `Ticket ${t.status.replace('_', ' ')} — ${t.subject}`,
        })),
      ]
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 5),
    [farms, tickets],
  );

  if (loading) return <CircularProgress />;
  if (!stats) return <Typography color="text.secondary">Couldn't load platform stats.</Typography>;

  const resolved = tickets.filter((t) => t.status === 'resolved').length;
  const resolvedPct = tickets.length ? Math.round((resolved / tickets.length) * 100) : 0;
  const farmBars = farms
    .filter((f) => f.sizeHectares)
    .sort((a, b) => (b.sizeHectares ?? 0) - (a.sizeHectares ?? 0))
    .slice(0, 5)
    .map((f) => ({ label: f.name, value: f.sizeHectares ?? 0, display: `${f.sizeHectares} ha` }));

  return (
    <Box>
      <PageHeader title="Overview" subtitle="Farms, auctions and support across the platform." />

      <Box sx={{ display: 'grid', gap: 2, mb: 2.5, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' } }}>
        <StatTile label="Total lots" value={stats.totalLots} icon={<Inventory2OutlinedIcon />} />
        <StatTile label="Volume (kg)" value={stats.totalVolumeKg.toLocaleString()} accent="secondary" icon={<ScaleOutlinedIcon />} />
        <StatTile label="Active auctions" value={stats.activeAuctions} accent="info" icon={<GavelIcon />} />
        <StatTile label="Registered farms" value={stats.totalFarms} accent="secondary" icon={<AgricultureOutlinedIcon />} />
        <StatTile label="Open tickets" value={stats.openTickets} accent="warning" icon={<SupportAgentIcon />} />
      </Box>

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', lg: '5fr 8fr' }, alignItems: 'start' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, order: { xs: 2, lg: 1 } }}>
          <Panel title="Ticket resolution" to="/admin/tickets">
            <Gauge
              value={resolvedPct}
              label={`${resolvedPct}%`}
              caption={tickets.length ? `${resolved} of ${tickets.length} tickets resolved` : 'No tickets filed yet'}
            />
          </Panel>
          <Panel title="Largest farms" to="/admin/farms">
            <BarChart bars={farmBars} empty="No farms with a recorded size yet." />
          </Panel>
          <Panel title="Recent activity">
            <ActivityFeed items={activity} />
          </Panel>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, order: { xs: 1, lg: 2 } }}>
          <FarmsMap farms={farms} selected={selected} onSelect={setSelected} height={{ xs: 320, md: 440 } as never} />
          <FarmsList farms={farms} selectedId={selected?.id} onSelect={setSelected} />
        </Box>
      </Box>
    </Box>
  );
}
