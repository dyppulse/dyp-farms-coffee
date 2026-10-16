import { Component, type ErrorInfo, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

type State = { failed: boolean };

/** Catches render errors so a bug in one page shows a recovery screen, not a blank app. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Box
        role="alert"
        sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center', px: 2 }}
      >
        <Box sx={{ maxWidth: 420 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Something went wrong
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            The page hit an unexpected error. Reload to try again. If it keeps happening, contact support.
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </Box>
      </Box>
    );
  }
}
