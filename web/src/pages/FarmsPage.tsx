import { useCallback, useEffect, useState } from 'react';
import { GoogleMap, Marker, Polygon, useJsApiLoader } from '@react-google-maps/api';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { api, type BoundaryPoint, type Farm } from '../api/client';
import { polygonAreaHectares } from '../utils/geo';

const DEFAULT_CENTER = { lat: 0.3476, lng: 32.5825 }; // Central Uganda

export function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [points, setPoints] = useState<BoundaryPoint[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
  });

  const load = useCallback(() => {
    setLoading(true);
    api.farms
      .list()
      .then(setFarms)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openDialog() {
    setName('');
    setPoints([]);
    setError(null);
    setDialogOpen(true);
  }

  const area = polygonAreaHectares(points);

  async function save() {
    if (!name.trim()) {
      setError('Give this farm a name.');
      return;
    }
    if (points.length === 0) {
      setError('Click the map to drop a pin, or trace a boundary (3+ points).');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.farms.create({
        name: name.trim(),
        sizeHectares: area > 0 ? Number(area.toFixed(2)) : undefined,
        boundary: points,
      });
      setDialogOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this farm.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(farm: Farm) {
    if (!confirm(`Remove "${farm.name}"? This can't be undone.`)) return;
    await api.farms.remove(farm.id);
    load();
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          My Farms
        </Typography>
        <Button variant="contained" onClick={openDialog}>
          + Add Farm
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Register every plot you farm — GPS location and boundary — so you can trace each harvest
        back to its source.
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : farms.length === 0 ? (
        <Typography color="text.secondary">No farms registered yet.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {farms.map((farm) => (
            <Card key={farm.id} variant="outlined">
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>{farm.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {farm.boundary.length === 1
                      ? 'Single pin'
                      : `${farm.boundary.length}-point boundary`}
                    {farm.sizeHectares ? ` · ~${farm.sizeHectares} ha` : ''}
                  </Typography>
                </Box>
                <IconButton onClick={() => remove(farm)} aria-label="remove farm">
                  <DeleteOutlineIcon />
                </IconButton>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Register a Farm</DialogTitle>
        <DialogContent>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}
          <TextField
            label="Farm name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            autoFocus
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Click the map to drop a pin, or click multiple points to trace a boundary.
          </Typography>
          {isLoaded ? (
            <Box sx={{ height: 320, borderRadius: 1, overflow: 'hidden' }}>
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={points[0] ? { lat: points[0].lat, lng: points[0].lng } : DEFAULT_CENTER}
                zoom={14}
                onClick={(e) => {
                  if (!e.latLng) return;
                  setPoints((prev) => [...prev, { lat: e.latLng!.lat(), lng: e.latLng!.lng() }]);
                }}
              >
                {points.length === 1 ? (
                  <Marker position={{ lat: points[0].lat, lng: points[0].lng }} />
                ) : null}
                {points.length >= 3 ? (
                  <Polygon
                    path={points.map((p) => ({ lat: p.lat, lng: p.lng }))}
                    options={{ fillColor: '#34d399', fillOpacity: 0.28, strokeColor: '#34d399', strokeWeight: 2 }}
                  />
                ) : null}
              </GoogleMap>
            </Box>
          ) : (
            <Alert severity="info">
              Set VITE_GOOGLE_MAPS_API_KEY to enable the map. You can still save a farm with just a
              name for now.
            </Alert>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Button size="small" onClick={() => setPoints((prev) => prev.slice(0, -1))} disabled={!points.length}>
              Undo point
            </Button>
            <Typography variant="body2" color="text.secondary">
              {points.length >= 3 ? `~${area.toFixed(2)} hectares` : `${points.length} point(s)`}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            Save Farm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
