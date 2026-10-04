import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'farmer' | 'roaster' | 'tourist'>('roaster');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password, name, role);
      }
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Paper sx={{ p: 4.5, width: '100%', maxWidth: 440, borderRadius: 6 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em' }}>Dyp Farms.</Typography>
        <Typography variant="h4" sx={{ mt: 2.5 }} gutterBottom>
          Coffee, traced end&#8209;to&#8209;end.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Buyer, farmer &amp; admin portal
        </Typography>

        <Tabs value={mode} onChange={(_, v) => setMode(v)} sx={{ mb: 2 }}>
          <Tab label="Log In" value="login" />
          <Tab label="Sign Up" value="signup" />
        </Tabs>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          {mode === 'signup' ? (
            <>
              <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
              <TextField
                select
                label="I am a…"
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
              >
                <MenuItem value="roaster">Buyer / Roaster</MenuItem>
                <MenuItem value="farmer">Farmer</MenuItem>
                <MenuItem value="tourist">Tourist</MenuItem>
              </TextField>
            </>
          ) : null}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {mode === 'login' ? 'Log In' : 'Create Account'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
