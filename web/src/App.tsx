import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { AuctionDetailPage } from './pages/AuctionDetailPage';
import { FarmsPage } from './pages/FarmsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SupportPage } from './pages/SupportPage';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminFarmsMapPage } from './pages/admin/AdminFarmsMapPage';
import { AdminTicketsPage } from './pages/admin/AdminTicketsPage';

function LoadingScreen() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress />
    </Box>
  );
}

function Protected({ children, adminOnly }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'farmer') return <Navigate to="/farms" replace />;
  return <Navigate to="/marketplace" replace />;
}

export default function App() {
  const { isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <HomeRedirect />
          </Protected>
        }
      />
      <Route
        path="/marketplace"
        element={
          <Protected>
            <MarketplacePage />
          </Protected>
        }
      />
      <Route
        path="/auctions/:lotId"
        element={
          <Protected>
            <AuctionDetailPage />
          </Protected>
        }
      />
      <Route
        path="/farms"
        element={
          <Protected>
            <FarmsPage />
          </Protected>
        }
      />
      <Route
        path="/notifications"
        element={
          <Protected>
            <NotificationsPage />
          </Protected>
        }
      />
      <Route
        path="/support"
        element={
          <Protected>
            <SupportPage />
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <Protected adminOnly>
            <AdminOverviewPage />
          </Protected>
        }
      />
      <Route
        path="/admin/farms"
        element={
          <Protected adminOnly>
            <AdminFarmsMapPage />
          </Protected>
        }
      />
      <Route
        path="/admin/tickets"
        element={
          <Protected adminOnly>
            <AdminTicketsPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
