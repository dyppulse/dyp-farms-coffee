import { lazy, Suspense, type ReactNode } from 'react';
import { ServerWakingBanner } from './components/ServerWakingBanner';
import { Navigate, Route, Routes } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DeleteAccountInfoPage, LegalPage } from './pages/LegalPage';
import { NotFoundPage } from './pages/NotFoundPage';

const MarketplacePage = lazy(() => import('./pages/MarketplacePage').then((m) => ({ default: m.MarketplacePage })));
const AuctionDetailPage = lazy(() => import('./pages/AuctionDetailPage').then((m) => ({ default: m.AuctionDetailPage })));
const FarmsPage = lazy(() => import('./pages/FarmsPage').then((m) => ({ default: m.FarmsPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const SupportPage = lazy(() => import('./pages/SupportPage').then((m) => ({ default: m.SupportPage })));
const AdminOverviewPage = lazy(() => import('./pages/admin/AdminOverviewPage').then((m) => ({ default: m.AdminOverviewPage })));
const AdminFarmsMapPage = lazy(() => import('./pages/admin/AdminFarmsMapPage').then((m) => ({ default: m.AdminFarmsMapPage })));
const AdminDemoAccountsPage = lazy(() => import('./pages/admin/AdminDemoAccountsPage').then((m) => ({ default: m.AdminDemoAccountsPage })));
const AdminTicketsPage = lazy(() => import('./pages/admin/AdminTicketsPage').then((m) => ({ default: m.AdminTicketsPage })));
const TicketDetailPage = lazy(() => import('./pages/TicketDetailPage').then((m) => ({ default: m.TicketDetailPage })));

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
  return (
    <AppLayout>
      <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
    </AppLayout>
  );
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
    <>
    <ServerWakingBanner />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/privacy" element={<LegalPage doc="privacy" />} />
      <Route path="/terms" element={<LegalPage doc="terms" />} />
      <Route path="/delete-account" element={<DeleteAccountInfoPage />} />
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
        path="/demo"
        element={
          <Protected adminOnly>
            <AdminDemoAccountsPage />
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
      <Route
        path="/admin/tickets/:id"
        element={
          <Protected adminOnly>
            <TicketDetailPage staff />
          </Protected>
        }
      />
      <Route
        path="/support/:id"
        element={
          <Protected>
            <TicketDetailPage />
          </Protected>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
}
