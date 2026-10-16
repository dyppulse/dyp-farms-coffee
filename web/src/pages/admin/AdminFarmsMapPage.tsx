import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import MapIcon from '@mui/icons-material/Map';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { FarmsMap } from '../../components/FarmsMap';
import { FarmsTable } from '../../components/FarmsTable';
import { PageHeader } from '../../components/ui';
import { api, type FarmWithOwner } from '../../api/client';
import { ErrorState } from '../../components/ErrorState';
import { useApiData } from '../../hooks/useApiData';

export function AdminFarmsMapPage() {
  const { data, loading, error, reload } = useApiData(() => api.admin.farms());
  const farms = useMemo(() => data ?? [], [data]);
  const [selected, setSelected] = useState<FarmWithOwner | null>(null);
  // /admin/farms?view=table opens the table directly (the overview's "See more" link).
  const [searchParams, setSearchParams] = useSearchParams();
  const view: 'map' | 'table' = searchParams.get('view') === 'table' ? 'table' : 'map';
  const setView = (next: 'map' | 'table') =>
    setSearchParams(next === 'table' ? { view: 'table' } : {}, { replace: true });

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
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
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
