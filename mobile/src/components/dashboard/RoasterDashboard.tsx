import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CoffeeLot, formatUGX } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { Card } from '../Card';
import { FilterChips } from '../FilterChips';
import { HeaderGreeting } from './HeaderGreeting';
import { DashData } from './types';

interface RoasterDashboardProps {
  data: DashData | null;
  lots: CoffeeLot[];
  unreadCount: number;
}

export function RoasterDashboard({ data, lots, unreadCount }: RoasterDashboardProps) {
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
      <HeaderGreeting name={user?.name ?? 'Roaster'} emoji="☕" unreadCount={unreadCount} />

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

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.navy,
    marginBottom: 12,
  },
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
});
