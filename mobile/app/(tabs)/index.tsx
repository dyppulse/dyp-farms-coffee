import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, apiExtended, CoffeeLot, Tour } from '../../src/api/client';
import { FarmerDashboard } from '../../src/components/dashboard/FarmerDashboard';
import { RoasterDashboard } from '../../src/components/dashboard/RoasterDashboard';
import { TouristDashboard } from '../../src/components/dashboard/TouristDashboard';
import { DashData } from '../../src/components/dashboard/types';
import { ScreenScrollView } from '../../src/components/ScreenScrollView';
import { useAuth } from '../../src/context/AuthContext';
import { colors, UserRole } from '../../src/theme/colors';

export default function DashboardScreen() {
  const { user } = useAuth();
  const role = (user?.role ?? 'roaster') as UserRole;
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<DashData | null>(null);
  const [lots, setLots] = useState<CoffeeLot[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [dash, lotsData, toursData, notifications] = await Promise.all([
        api.dashboard.get().catch(() => null),
        api.lots.list().catch(() => []),
        api.tours.list().catch(() => []),
        apiExtended.notifications.list().catch(() => []),
      ]);
      setData(dash);
      setLots(lotsData);
      setTours(toursData);
      setUnreadCount(notifications.filter((n) => !n.read).length);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenScrollView
        inTabs
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.navy}
          />
        }
      >
        {role === 'farmer' ? (
          <FarmerDashboard data={data} unreadCount={unreadCount} />
        ) : null}
        {role === 'roaster' ? (
          <RoasterDashboard data={data} lots={lots} unreadCount={unreadCount} />
        ) : null}
        {role === 'tourist' ? <TouristDashboard tours={tours} /> : null}
      </ScreenScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lavender },
  scrollContent: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.lavender },
});
