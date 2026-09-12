import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { api, type AppNotification } from '../api/client';

const ICONS: Record<AppNotification['type'], string> = {
  bid: '⚡',
  grading: '🔬',
  payment: '💰',
  shipment: '🚚',
  weather: '☀️',
  general: '🔔',
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.notifications
      .list()
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, []);

  async function handleClick(n: AppNotification) {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      api.notifications.markRead(n.id).catch(() => {});
    }
    if (n.entityType === 'auction' && n.entityId) navigate(`/auctions/${n.entityId}`);
    else if (n.entityType === 'lot' && n.entityId) navigate(`/auctions/${n.entityId}`);
  }

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800 }} gutterBottom>
        Notifications
      </Typography>
      {notifications.length === 0 ? (
        <Typography color="text.secondary">You're all caught up.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 640 }}>
          {notifications.map((n) => (
            <Card key={n.id} variant="outlined" sx={{ borderLeft: n.read ? undefined : '4px solid', borderLeftColor: 'primary.main' }}>
              <CardActionArea onClick={() => handleClick(n)}>
                <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Typography sx={{ fontSize: 22 }}>{ICONS[n.type] ?? '🔔'}</Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: n.read ? 500 : 700 }}>{n.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {n.body}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(n.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  {!n.read ? <Chip label="New" size="small" color="primary" /> : null}
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
