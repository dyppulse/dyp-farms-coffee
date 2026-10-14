import { useSyncExternalStore } from 'react';
import Alert from '@mui/material/Alert';
import { isServerSlow, subscribeSlow } from '../api/client';

/**
 * Shown when a request has been pending for a few seconds. The API runs on Render's free
 * tier, which sleeps when idle and takes up to ~50s to wake — without this the UI just
 * looks frozen.
 */
export function ServerWakingBanner() {
  const slow = useSyncExternalStore(subscribeSlow, isServerSlow);
  if (!slow) return null;
  return (
    <Alert
      severity="info"
      sx={{
        position: 'fixed',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: (t) => t.zIndex.snackbar,
        maxWidth: 'calc(100vw - 32px)',
        boxShadow: 3,
      }}
    >
      Waking up the server — this can take up to a minute after a period of inactivity.
    </Alert>
  );
}
