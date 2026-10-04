import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import MapIcon from '@mui/icons-material/Map';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { FarmsMap, farmCenter } from '../../components/FarmsMap';
import { PageHeader } from '../../components/ui';
import { FONT_MONO } from '../../theme';
import { api, type FarmWithOwner } from '../../api/client';

export function AdminFarmsMapPage() {
  const [farms, setFarms] = useState<FarmWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FarmWithOwner | null>(null);
  const [view, setView] = useState<'map' | 'table'>('map');

  useEffect(() => {
    api.admin
      .farms()
      .then(setFarms)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <PageHeader eyebrow="GEOSPATIAL" title="Farms" subtitle={`Every registered farm on the platform — ${farms.length} total.`} />
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)}>
          <ToggleButton value="map">
            <MapIcon fontSize="small" sx={{ mr: 0.75 }} /> Map
          </ToggleButton>
          <ToggleButton value="table">
            <TableRowsIcon fontSize="small" sx={{ mr: 0.75 }} /> Table
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : view === 'table' ? (
        <FarmsTable
          farms={farms}
          onLocate={(farm) => {
            setSelected(farm);
            setView('map');
          }}
        />
      ) : (
        <FarmsMap farms={farms} selected={selected} onSelect={setSelected} height="70vh" />
      )}
    </Box>
  );
}

function FarmsTable({ farms, onLocate }: { farms: FarmWithOwner[]; onLocate: (farm: FarmWithOwner) => void }) {
  if (!farms.length) return <Alert severity="info">No farms registered yet.</Alert>;
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Farm</TableCell>
            <TableCell>Owner</TableCell>
            <TableCell align="right">Size</TableCell>
            <TableCell>Boundary</TableCell>
            <TableCell>Centre (lat, lng)</TableCell>
            <TableCell>Registered</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {farms.map((farm) => {
            const c = farmCenter(farm);
            return (
              <TableRow key={farm.id} hover sx={{ cursor: 'pointer' }} onClick={() => onLocate(farm)}>
                <TableCell sx={{ fontWeight: 600 }}>{farm.name}</TableCell>
                <TableCell>
                  {farm.owner?.name ?? 'Unknown'}
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    {farm.owner?.email}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: FONT_MONO }}>
                  {farm.sizeHectares ? `${farm.sizeHectares} ha` : '—'}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={farm.boundary.length >= 3 ? 'secondary' : 'default'}
                    variant="outlined"
                    label={farm.boundary.length >= 3 ? `polygon · ${farm.boundary.length} pts` : 'pin'}
                  />
                </TableCell>
                <TableCell sx={{ fontFamily: FONT_MONO, fontSize: 12 }}>
                  {c.lat.toFixed(4)}, {c.lng.toFixed(4)}
                </TableCell>
                <TableCell sx={{ fontFamily: FONT_MONO, fontSize: 12 }}>
                  {new Date(farm.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
