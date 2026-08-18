import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, CoffeeLot, formatUGX, Tour } from '../../src/api/client';
import { Card } from '../../src/components/Card';
import { FilterChips } from '../../src/components/FilterChips';
import { ScreenScrollView } from '../../src/components/ScreenScrollView';
import { StatusPill } from '../../src/components/StatusPill';
import { useAuth } from '../../src/context/AuthContext';
import { colors, UserRole } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';

type DashData = Awaited<ReturnType<typeof api.dashboard.get>>;

function HeaderGreeting({
  name,
  emoji,
  subtitle,
}: {
  name: string;
  emoji: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.headerRow}>
      <View style={{ flex: 1 }}>
        {subtitle ? <Text style={styles.goodMorning}>{subtitle}</Text> : null}
        <Text style={styles.name}>
          {name} {emoji}
        </Text>
      </View>
      <Pressable
        style={styles.bell}
        onPress={() => router.push('/notifications')}
      >
        <Ionicons name="notifications-outline" size={22} color={colors.navy} />
        <View style={styles.bellDot} />
      </Pressable>
    </View>
  );
}

function FarmerDashboard({ data }: { data: DashData | null }) {
  const { user } = useAuth();
  const actions = [
    { label: 'Add Harvest', emoji: '🌿', color: colors.farmerGreen, route: '/quality' },
    { label: 'Request Finance', emoji: '💰', color: colors.navy2, route: '/(tabs)/wallet' },
    { label: 'AI Quality Check', emoji: '🔬', color: colors.touristPurple, route: '/quality' },
    { label: 'Sell Lots', emoji: '📦', color: colors.amber, route: '/(tabs)/marketplace' },
  ];

  return (
    <>
      <HeaderGreeting name={user?.name ?? 'Farmer'} emoji="👋" subtitle="Good morning," />

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

      <Card style={styles.weatherCard}>
        <Text style={styles.sectionTitle}>Weather Insights</Text>
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
    </>
  );
}

function RoasterDashboard({
  data,
  lots,
}: {
  data: DashData | null;
  lots: CoffeeLot[];
}) {
  const { user } = useAuth();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const auctionLot = lots.find((l) => l.inAuction);

  const filtered = lots.filter((l) => {
    if (filter === 'All') return true;
    return (
      l.name.toLowerCase().includes(filter.toLowerCase()) ||
      l.grade.toLowerCase().includes(filter.toLowerCase()) ||
      l.origin.toLowerCase().includes(filter.toLowerCase())
    );
  });

  return (
    <>
      <HeaderGreeting name={user?.name ?? 'Roaster'} emoji="☕" />

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by origin, grade, variety…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {auctionLot ? (
        <LinearGradient
          colors={[colors.navy, colors.navy2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.auctionBanner}
        >
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE AUCTION</Text>
          </View>
          <Text style={styles.auctionName}>{auctionLot.name}</Text>
          <Text style={styles.auctionMeta}>
            {auctionLot.grade} · {auctionLot.quantity} {auctionLot.unit}
          </Text>
          <Pressable
            style={styles.joinBtn}
            onPress={() => router.push(`/auction/${auctionLot.id}`)}
          >
            <Text style={styles.joinBtnText}>Join Auction →</Text>
          </Pressable>
        </LinearGradient>
      ) : null}

      <FilterChips
        options={['All', 'Arabica', 'Robusta', 'Premium', 'Organic']}
        value={filter}
        onChange={setFilter}
      />

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Available Lots</Text>
      {filtered
        .filter((l) =>
          search
            ? `${l.name} ${l.origin} ${l.grade}`
                .toLowerCase()
                .includes(search.toLowerCase())
            : true,
        )
        .map((lot) => (
          <Pressable key={lot.id} onPress={() => router.push(`/lot/${lot.id}`)}>
            <Card style={styles.lotRow}>
              <View style={styles.lotThumb}>
                <Text style={{ fontSize: 28 }}>☕</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lotName}>{lot.name}</Text>
                <Text style={styles.lotOrigin}>
                  {lot.origin} · {lot.grade}
                </Text>
                <Text style={styles.lotPrice}>
                  ${lot.price}/kg · {lot.quantity}
                  {lot.unit}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Card>
          </Pressable>
        ))}

      <Card style={{ marginTop: 8 }}>
        <Text style={styles.statLabel}>Wallet</Text>
        <Text style={styles.statValue}>{formatUGX(data?.walletBalance ?? 0)}</Text>
      </Card>
    </>
  );
}

function TouristDashboard({ tours }: { tours: Tour[] }) {
  const { user } = useAuth();

  return (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.name}>Coffee Tours 🗺️</Text>
        <View style={styles.nearPill}>
          <Text style={styles.nearText}>📍 Near Me</Text>
        </View>
      </View>

      <View style={styles.mapCard}>
        <LinearGradient
          colors={['#A8C5A0', '#3D6B4F']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.mapOverlay}>
          <View style={styles.mapSearch}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <Text style={styles.mapSearchText}>Search farms near you…</Text>
          </View>
          <View style={styles.pins}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.pin,
                  i === 0 ? styles.pinActive : styles.pinIdle,
                  { left: 40 + i * 70, top: 50 + (i % 2) * 40 },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nearby Tours</Text>
        <Pressable onPress={() => router.push('/(tabs)/tours')}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {tours.slice(0, 5).map((t) => (
          <Pressable key={t.id} onPress={() => router.push(`/tour/${t.id}`)}>
            <Card style={styles.tourCardH}>
              <Text style={styles.tourEmoji}>🏞️</Text>
              <Text style={styles.tourTitle} numberOfLines={2}>
                {t.title}
              </Text>
              <Text style={styles.tourMeta}>
                ★ {t.rating} · {formatUGX(t.pricePerGuest)}
              </Text>
              <Pressable
                style={styles.bookMini}
                onPress={() => router.push(`/tour/${t.id}`)}
              >
                <Text style={styles.bookMiniText}>Book Now</Text>
              </Pressable>
            </Card>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Community Stories</Text>
      {[
        { name: 'Sarah K.', text: 'Amazing harvest experience at Limuru!', likes: 24 },
        { name: 'Marco R.', text: 'The cupping session changed how I taste coffee.', likes: 18 },
      ].map((s) => (
        <Card key={s.name} style={styles.storyCard}>
          <Text style={styles.storyName}>{s.name}</Text>
          <Text style={styles.storyText}>{s.text}</Text>
          <Text style={styles.storyLikes}>♥ {s.likes}</Text>
        </Card>
      ))}

      <Text style={{ opacity: 0, height: 0 }}>{user?.name}</Text>
    </>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const role = (user?.role ?? 'roaster') as UserRole;
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<DashData | null>(null);
  const [lots, setLots] = useState<CoffeeLot[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [dash, lotsData, toursData] = await Promise.all([
        api.dashboard.get().catch(() => null),
        api.lots.list().catch(() => []),
        api.tours.list().catch(() => []),
      ]);
      setData(dash);
      setLots(lotsData);
      setTours(toursData);
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
      {role === 'farmer' ? <FarmerDashboard data={data} /> : null}
      {role === 'roaster' ? <RoasterDashboard data={data} lots={lots} /> : null}
      {role === 'tourist' ? <TouristDashboard tours={tours} /> : null}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lavender },
  scrollContent: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.lavender },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  goodMorning: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  name: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.navy,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {
    fontFamily: fonts.displaySemi,
    fontSize: 13,
    color: colors.navy2,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.navy,
  },
  auctionBanner: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
  liveText: {
    fontFamily: fonts.displaySemi,
    fontSize: 11,
    color: colors.red,
    letterSpacing: 1,
  },
  auctionName: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.white,
  },
  auctionMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    marginBottom: 14,
  },
  joinBtn: {
    backgroundColor: colors.red,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  joinBtnText: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.white,
  },
  lotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  lotThumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lotName: {
    fontFamily: fonts.displaySemi,
    fontSize: 15,
    color: colors.navy,
  },
  lotOrigin: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  lotPrice: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.navy2,
    marginTop: 4,
  },
  nearPill: {
    backgroundColor: colors.navy,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  nearText: {
    fontFamily: fonts.displaySemi,
    fontSize: 12,
    color: colors.white,
  },
  mapCard: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  mapOverlay: { flex: 1, padding: 16 },
  mapSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  mapSearchText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  pins: { flex: 1 },
  pin: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  pinActive: { backgroundColor: colors.red },
  pinIdle: { backgroundColor: colors.white, borderWidth: 3, borderColor: colors.navy2 },
  tourCardH: {
    width: 180,
    marginRight: 12,
  },
  tourEmoji: { fontSize: 28, marginBottom: 8 },
  tourTitle: {
    fontFamily: fonts.displaySemi,
    fontSize: 14,
    color: colors.navy,
    minHeight: 40,
  },
  tourMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginVertical: 8,
  },
  bookMini: {
    backgroundColor: colors.navy,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  bookMiniText: {
    fontFamily: fonts.displaySemi,
    fontSize: 12,
    color: colors.white,
  },
  storyCard: { marginBottom: 10 },
  storyName: {
    fontFamily: fonts.displaySemi,
    fontSize: 14,
    color: colors.navy,
  },
  storyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textBody,
    marginTop: 4,
  },
  storyLikes: {
    fontFamily: fonts.displayMedium,
    fontSize: 12,
    color: colors.red,
    marginTop: 8,
  },
});
