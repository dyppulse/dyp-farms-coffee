import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatUGX } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { Card } from '../Card';
import { HeaderGreeting } from './HeaderGreeting';
import { DashData } from './types';

interface FarmerDashboardProps {
  data: DashData | null;
  unreadCount: number;
}

export function FarmerDashboard({ data, unreadCount }: FarmerDashboardProps) {
  const { user } = useAuth();
  const actions = [
    { label: 'Add Harvest', emoji: '🌿', color: colors.farmerGreen, route: '/quality' },
    { label: 'Ask AI Assistant', emoji: '🤖', color: colors.navy2, route: '/ai-assistant' },
    { label: 'AI Quality Check', emoji: '🔬', color: colors.touristPurple, route: '/quality' },
    { label: 'Request Finance', emoji: '💰', color: colors.amber, route: '/(tabs)/wallet' },
  ];

  return (
    <>
      <HeaderGreeting
        name={user?.name ?? 'Farmer'}
        emoji="👋"
        subtitle="Good morning,"
        unreadCount={unreadCount}
      />

      <LinearGradient
        colors={[colors.farmerGreen, colors.farmerGreenDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.walletCard}
      >
        <Text style={styles.walletLabel}>Wallet Balance</Text>
        <Text style={styles.walletBalance}>{formatUGX(data?.walletBalance ?? 0)}</Text>
        <View style={styles.walletActions}>
          {['Deposit', 'Withdraw', 'Transfer'].map((a) => (
            <Pressable
              key={a}
              style={styles.walletAction}
              onPress={() => router.push('/(tabs)/wallet')}
            >
              <Text style={styles.walletActionText}>{a}</Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {actions.map((a) => (
          <Pressable
            key={a.label}
            style={styles.actionCard}
            onPress={() => router.push(a.route as never)}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${a.color}18` }]}>
              <Text style={{ fontSize: 22 }}>{a.emoji}</Text>
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Summary</Text>
      <View style={styles.statsGrid}>
        {[
          { label: 'Lots in Warehouse', value: String(data?.warehouseLots ?? 0) },
          { label: 'Pending Payments', value: formatUGX(data?.pendingPayments ?? 0) },
          { label: 'Active Auctions', value: data?.auctionStatus ?? '—' },
          {
            label: 'Weather',
            value: `${data?.weatherInsights.temperature ?? '—'}°C`,
          },
        ].map((s) => (
          <Card key={s.label} style={styles.statCard}>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
          </Card>
        ))}
      </View>

      <Pressable onPress={() => router.push('/weather')}>
        <Card style={styles.weatherCard}>
          <View style={styles.weatherHeader}>
            <Text style={styles.sectionTitle}>
              Weather Insights{data?.weatherInsights.location ? ` · ${data.weatherInsights.location}` : ''}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
          <View style={styles.weatherRow}>
            <Ionicons name="partly-sunny" size={32} color={colors.amber} />
            <View style={{ flex: 1 }}>
              <Text style={styles.weatherTemp}>
                {data?.weatherInsights.temperature}°C · {data?.weatherInsights.humidity}% humidity
              </Text>
              <Text style={styles.weatherForecast}>{data?.weatherInsights.forecast}</Text>
            </View>
          </View>
        </Card>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  walletCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  walletLabel: {
    fontFamily: fonts.displayMedium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  walletBalance: {
    fontFamily: fonts.displayExtra,
    fontSize: 32,
    color: colors.white,
    marginTop: 4,
    marginBottom: 16,
  },
  walletActions: { flexDirection: 'row', gap: 8 },
  walletAction: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  walletActionText: {
    fontFamily: fonts.displaySemi,
    fontSize: 12,
    color: colors.white,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.navy,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontFamily: fonts.displayMedium,
    fontSize: 12,
    color: colors.navy,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: { width: '47%' },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.navy,
    marginTop: 4,
  },
  weatherCard: { marginBottom: 8 },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  weatherTemp: {
    fontFamily: fonts.displayMedium,
    fontSize: 14,
    color: colors.navy,
  },
  weatherForecast: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
