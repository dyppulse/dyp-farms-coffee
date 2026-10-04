import { useState, type ReactNode } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ColorModeContext';

interface NavItem {
  label: string;
  to: string;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { palette } = useTheme();
  const { mode, toggle } = useColorMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const navItems: NavItem[] = [];
  if (user?.role === 'admin') {
    navItems.push({ label: 'Overview', to: '/admin' });
    navItems.push({ label: 'Farms', to: '/admin/farms' });
    navItems.push({ label: 'Tickets', to: '/admin/tickets' });
  }
  if (user?.role === 'roaster') navItems.push({ label: 'Marketplace', to: '/marketplace' });
  if (user?.role === 'farmer') navItems.push({ label: 'My Farms', to: '/farms' });
  navItems.push({ label: 'Support', to: '/support' });

  const isActive = (to: string) => location.pathname === to;

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 1.5, md: 2.5 } }}>
      {/* The whole app lives inside one rounded shell, like a single dashboard card */}
      <Box
        sx={{
          maxWidth: 1600,
          mx: 'auto',
          minHeight: 'calc(100vh - 40px)',
          borderRadius: { xs: 4, md: 6 },
          bgcolor: 'background.default',
          border: 1,
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <AppBar>
          <Toolbar sx={{ gap: 1.5, px: { xs: 2, md: 4 }, py: 2.5, minHeight: 'auto' }}>
            <IconButton onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' } }} aria-label="Menu">
              <MenuIcon fontSize="small" />
            </IconButton>

            <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'inherit', textDecoration: 'none', mr: { md: 4 } }}>
              <Box sx={{ width: 30, height: 30, borderRadius: '10px', bgcolor: 'primary.main', display: 'grid', placeItems: 'center' }}>
                <Typography sx={{ color: 'primary.contrastText', fontWeight: 800, fontSize: 16, lineHeight: 1 }}>D</Typography>
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em' }}>Dyp Farms.</Typography>
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flexGrow: 1 }}>
              {navItems.map((item) => (
                <Box
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  sx={{
                    px: 2,
                    py: 0.9,
                    borderRadius: 999,
                    fontSize: 15,
                    fontWeight: 500,
                    textDecoration: 'none',
                    color: isActive(item.to) ? 'text.primary' : 'text.secondary',
                    bgcolor: isActive(item.to) ? alpha(palette.text.primary, 0.08) : 'transparent',
                    '&:hover': { color: 'text.primary' },
                  }}
                >
                  {item.label}
                </Box>
              ))}
            </Box>
            <Box sx={{ flexGrow: 1, display: { md: 'none' } }} />

            <IconButton onClick={toggle} aria-label="Toggle light/dark mode" sx={{ width: 42, height: 42 }}>
              {mode === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
            </IconButton>
            <IconButton component={RouterLink} to="/notifications" aria-label="Notifications" sx={{ width: 42, height: 42 }}>
              <NotificationsNoneIcon fontSize="small" />
            </IconButton>
            <Box
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                pl: 0.75,
                pr: { xs: 0.75, sm: 2 },
                py: 0.75,
                borderRadius: 999,
                border: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                cursor: 'pointer',
              }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', color: 'primary.contrastText', fontSize: 14, fontWeight: 700 }}>
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, lineHeight: 1.2 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{user?.name}</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', textTransform: 'capitalize' }}>{user?.role}</Typography>
              </Box>
            </Box>
            <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
              <MenuItem disabled>{user?.email}</MenuItem>
              <MenuItem
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                Log out
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { md: 'none' } }}>
          <List sx={{ width: 240, pt: 3 }}>
            {navItems.map((item) => (
              <ListItemButton key={item.to} component={RouterLink} to={item.to} selected={isActive(item.to)} onClick={() => setMobileOpen(false)}>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Drawer>

        <Box component="main" sx={{ px: { xs: 2, md: 4 }, pt: { xs: 3, md: 5 }, pb: 5 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
