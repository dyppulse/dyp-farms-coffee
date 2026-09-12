import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { api, type AdminStats } from '../../api/client';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800 }} color="primary.main">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin
      .stats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;
  if (!stats) return <Typography color="text.secondary">Couldn't load platform stats.</Typography>;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800 }} gutterBottom>
        Platform Overview
      </Typography>
      <Grid container spacing={2} sx={{ maxWidth: 900 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Total lots" value={stats.totalLots} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Total volume (kg)" value={stats.totalVolumeKg.toLocaleString()} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Active auctions" value={stats.activeAuctions} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Registered farms" value={stats.totalFarms} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard label="Open support tickets" value={stats.openTickets} />
        </Grid>
      </Grid>
    </Box>
  );
}
