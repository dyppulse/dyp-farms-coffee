import { ActivityIndicator } from 'react-native';
import { render, screen, waitFor } from '@testing-library/react-native';
import DashboardScreen from '../../app/(tabs)/index';

// A real GET /api/dashboard response (farmer), captured from the running backend.
const mockDashboard = {
  walletBalance: 0,
  pendingPayments: 0,
  auctionStatus: '2 active auctions',
  weatherInsights: {
    location: 'Uganda',
    place: 'Mbale, Mt Elgon',
    temperature: 24,
    humidity: 71,
    forecast: 'Overcast',
  },
  warehouseLots: 3,
};

let mockRole = 'farmer';

// Icons need native font loading, which doesn't exist under jest.
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return { useFocusEffect: (cb: () => void) => React.useEffect(cb, []) };
});
jest.mock('@react-navigation/bottom-tabs', () => ({ useBottomTabBarHeight: () => 0 }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Test User', role: mockRole } }),
}));
jest.mock('../api/client', () => ({
  api: {
    dashboard: { get: jest.fn(() => Promise.resolve(mockDashboard)) },
    lots: { list: jest.fn(() => Promise.resolve([])) },
    tours: { list: jest.fn(() => Promise.resolve([])) },
  },
  apiExtended: { notifications: { list: jest.fn(() => Promise.resolve([])) } },
  formatUGX: (n: number) => `UGX ${n}`,
}));

describe('dashboard Weather Insights card', () => {
  it('renders for a farmer with the live weather data', async () => {
    mockRole = 'farmer';
    render(<DashboardScreen />);
    await waitFor(() => expect(screen.getByText(/Weather Insights/)).toBeTruthy());
    expect(screen.getByText('Weather Insights · Uganda')).toBeTruthy();
    expect(screen.getByText('24°C · 71% humidity')).toBeTruthy();
    expect(screen.getByText('Overcast')).toBeTruthy();
  });

  it.each(['roaster', 'tourist'])('does not render for a %s', async (role) => {
    mockRole = role;
    render(<DashboardScreen />);
    // Wait for the data to load (spinner gone) so we're asserting on the real screen.
    await waitFor(() => expect(screen.UNSAFE_queryByType(ActivityIndicator)).toBeNull());
    expect(screen.queryByText(/Weather Insights/)).toBeNull();
    expect(screen.queryByText('Overcast')).toBeNull();
  });
});
