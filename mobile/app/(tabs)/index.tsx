import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, formatUGX } from '../../src/api/client';
import { Card } from '../../src/components/Card';
import { ScreenScrollView } from '../../src/components/ScreenScrollView';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/theme/colors';

const quickActions = [
  { label: 'Add Harvest', icon: 'leaf' as const, route: '/quality' },
  { label: 'Request Financing', icon: 'card' as const, route: '/wallet' },
  { label: 'Track Logistics', icon: 'boat' as const, route: '/logistics' },
  { label: 'AI Quality Check', icon: 'scan' as const, route: '/quality' },
];

export default function DashboardScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<Awaited<ReturnType<typeof api.dashboard.get>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await api.dashboard.get();
      setData(result);
    } catch {
      setData(null);
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScreenScrollView
      inTabs
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
      }
    >
      <View style={styles.greeting}>
        <Text style={styles.welcome}>Welcome back,</Text>
        <Text style={styles.name}>{user?.name}</Text>
      </View>

      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <Text style={styles.balance}>
          {formatUGX(data?.walletBalance ?? 0)}
        </Text>
      </Card>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => (
          <Pressable
            key={action.label}
            style={styles.actionItem}
            onPress={() => router.push(action.route as never)}
          >
            <View style={styles.actionIcon}>
              <Ionicons name={action.icon} size={24} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Auction Status</Text>
          <Text style={styles.statValue}>{data?.auctionStatus}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Pending Payments</Text>
          <Text style={styles.statValue}>{data?.pendingPayments}</Text>
        </Card>
      </View>

      <Card style={styles.weatherCard}>
        <Text style={styles.sectionTitle}>Weather Insights</Text>
        <View style={styles.weatherRow}>
          <Ionicons name="partly-sunny" size={32} color={colors.accent} />
          <View style={styles.weatherInfo}>
            <Text style={styles.weatherTemp}>
              {data?.weatherInsights.temperature}°C · {data?.weatherInsights.humidity}% humidity
            </Text>
            <Text style={styles.weatherForecast}>{data?.weatherInsights.forecast}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.warehouseCard}>
        <Text style={styles.sectionTitle}>Current Lots in Warehouse b1a</Text>
        <Text style={styles.warehouseCount}>{data?.warehouseLots} lots available</Text>
      </Card>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  greeting: { marginBottom: 16 },
  welcome: { fontSize: 14, color: colors.textSecondary },
  name: { fontSize: 24, fontWeight: '700', color: colors.text },
  balanceCard: { backgroundColor: colors.primary, marginBottom: 20 },
  balanceLabel: { color: colors.accent, fontSize: 14 },
  balance: { color: colors.white, fontSize: 36, fontWeight: '700', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  actionItem: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: { fontSize: 12, fontWeight: '500', color: colors.text, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1 },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  statValue: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 4 },
  weatherCard: { marginBottom: 16 },
  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  weatherInfo: { flex: 1 },
  weatherTemp: { fontSize: 14, fontWeight: '500', color: colors.text },
  weatherForecast: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  warehouseCard: { marginBottom: 0 },
  warehouseCount: { fontSize: 20, fontWeight: '600', color: colors.primary },
});
