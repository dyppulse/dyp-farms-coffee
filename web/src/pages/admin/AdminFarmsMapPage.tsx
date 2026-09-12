import { useEffect, useState } from 'react';
import { GoogleMap, InfoWindow, Marker, Polygon, useJsApiLoader } from '@react-google-maps/api';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { api, type FarmWithOwner } from '../../api/client';

const DEFAULT_CENTER = { lat: 0.3476, lng: 32.5825 }; // Central Uganda

function farmCenter(farm: FarmWithOwner) {
  const lat = farm.boundary.reduce((s, p) => s + p.lat, 0) / farm.boundary.length;
  const lng = farm.boundary.reduce((s, p) => s + p.lng, 0) / farm.boundary.length;
  return { lat, lng };
}

export function AdminFarmsMapPage() {
  const [farms, setFarms] = useState<FarmWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FarmWithOwner | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
  });

  useEffect(() => {
    api.admin
      .farms()
      .then(setFarms)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800 }} gutterBottom>
        Farms Map
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Every registered farm on the platform — {farms.length} total.
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : !import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
        <Alert severity="info">
          Set <code>VITE_GOOGLE_MAPS_API_KEY</code> to render this map. Farms on file:{' '}
          {farms.map((f) => f.name).join(', ') || 'none yet'}.
        </Alert>
      ) : !isLoaded ? (
        <CircularProgress />
      ) : (
        <Box sx={{ height: '70vh', borderRadius: 1, overflow: 'hidden' }}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={farms[0] ? farmCenter(farms[0]) : DEFAULT_CENTER}
            zoom={farms.length ? 8 : 6}
          >
            {farms.map((farm) =>
              farm.boundary.length >= 3 ? (
                <Polygon
                  key={farm.id}
                  path={farm.boundary.map((p) => ({ lat: p.lat, lng: p.lng }))}
                  options={{ fillColor: '#166534', fillOpacity: 0.25, strokeColor: '#166534' }}
                  onClick={() => setSelected(farm)}
                />
              ) : (
                <Marker
                  key={farm.id}
                  position={farmCenter(farm)}
                  onClick={() => setSelected(farm)}
                />
              ),
            )}
            {selected ? (
              <InfoWindow position={farmCenter(selected)} onCloseClick={() => setSelected(null)}>
                <Box sx={{ minWidth: 160 }}>
                  <Typography sx={{ fontWeight: 700 }}>{selected.name}</Typography>
                  <Typography variant="body2">
                    Owner: {selected.owner?.name ?? 'Unknown'}
                  </Typography>
                  {selected.sizeHectares ? (
                    <Typography variant="body2">~{selected.sizeHectares} ha</Typography>
                  ) : null}
                </Box>
              </InfoWindow>
            ) : null}
          </GoogleMap>
        </Box>
      )}
    </Box>
  );
}
