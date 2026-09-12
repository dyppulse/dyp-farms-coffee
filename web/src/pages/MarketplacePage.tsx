import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import { api, type CoffeeLot } from '../api/client';

const GRADES = ['All grades', 'Grade A+', 'Grade A', 'Grade B', 'Grade C'];

export function MarketplacePage() {
  const navigate = useNavigate();
  const [lots, setLots] = useState<CoffeeLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [grade, setGrade] = useState('All grades');

  useEffect(() => {
    api.lots
      .list()
      .then(setLots)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return lots.filter((lot) => {
      const matchesQuery =
        !query ||
        lot.name.toLowerCase().includes(query.toLowerCase()) ||
        lot.origin.toLowerCase().includes(query.toLowerCase()) ||
        lot.lotNumber.includes(query);
      const matchesGrade = grade === 'All grades' || lot.grade === grade;
      return matchesQuery && matchesGrade;
    });
  }, [lots, query, grade]);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800 }} gutterBottom>
        Marketplace
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Search and filter coffee lots with your keyboard — built for desktop buyers.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by name, origin, or lot number…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          sx={{ flex: 1, minWidth: 260 }}
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
        <TextField select label="Grade" value={grade} onChange={(e) => setGrade(e.target.value)} sx={{ minWidth: 160 }}>
          {GRADES.map((g) => (
            <MenuItem key={g} value={g}>
              {g}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : filtered.length === 0 ? (
        <Typography color="text.secondary">No lots match your search.</Typography>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((lot) => (
            <Grid key={lot.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined">
                <CardActionArea onClick={() => navigate(`/auctions/${lot.id}`)}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {lot.name}
                      </Typography>
                      <Chip label={lot.grade} size="small" color="secondary" />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {lot.origin} · Lot #{lot.lotNumber}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {lot.quantity} {lot.unit} · ${lot.price.toFixed(2)}/kg
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Traceability: {lot.traceability}
                    </Typography>
                    {lot.inAuction ? (
                      <Chip label="Live auction" size="small" color="warning" sx={{ mt: 1 }} />
                    ) : null}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
