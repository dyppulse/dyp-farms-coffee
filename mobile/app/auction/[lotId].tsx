import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, Auction } from '../../src/api/client';
import { Button } from '../../src/components/Button';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { ScreenScrollView } from '../../src/components/ScreenScrollView';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';

export default function AuctionScreen() {
  const { lotId } = useLocalSearchParams<{ lotId: string }>();
  const insets = useSafeAreaInsets();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [autoBid, setAutoBid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);

  const load = useCallback(async () => {
    if (!lotId) return;
    try {
      const result = await api.auctions.get(lotId);
      setAuction(result);
      setBidAmount((result.currentBid + 0.15).toFixed(2));
      setRemainingMs(Math.max(0, new Date(result.endsAt).getTime() - Date.now()));
    } finally {
      setLoading(false);
    }
  }, [lotId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!auction) return;
    const interval = setInterval(() => {
      setRemainingMs(Math.max(0, new Date(auction.endsAt).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [auction]);

  const countdown = useMemo(() => {
    const total = Math.floor(remainingMs / 1000);
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return {
      hrs: String(hrs).padStart(2, '0'),
      mins: String(mins).padStart(2, '0'),
      secs: String(secs).padStart(2, '0'),
    };
  }, [remainingMs]);

  const quickBids = useMemo(() => {
    if (!auction) return [];
    const base = auction.currentBid;
    return [base + 0.1, base + 0.15, base + 0.25, base + 0.45].map((v) =>
      v.toFixed(2),
    );
  }, [auction]);

  async function handleBid() {
    const amount = parseFloat(bidAmount);
    if (!amount || !lotId) return;
    setBidding(true);
    try {
      await api.auctions.bid(lotId, amount, autoBid);
      await load();
      setPlaced(true);
      Alert.alert('Bid Placed', `Your bid of $${amount} has been placed`);
    } catch (e) {
      Alert.alert('Bid Failed', (e as Error).message);
    } finally {
      setBidding(false);
    }
  }

  if (loading || !auction) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  const qty = auction.lot?.quantity ?? 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[colors.navy, colors.navy2]} style={styles.top}>
        <ScreenHeader
          title="Auction Room"
          light
          right={
            <View style={styles.liveBadge}>
              <Text style={styles.liveText}>⚡ LIVE</Text>
            </View>
          }
        />
        <View style={styles.hero}>
          <Text style={{ fontSize: 48 }}>☕</Text>
        </View>
        <Text style={styles.lotName}>{auction.lot?.name ?? 'Coffee Lot'}</Text>
        <Text style={styles.lotMeta}>
          {auction.lot?.origin ?? '—'} · {auction.lot?.grade ?? '—'} · {qty}{' '}
          {auction.lot?.unit ?? 'kg'}
        </Text>
      </LinearGradient>

      <ScreenScrollView contentContainerStyle={styles.content}>
        <View style={styles.countdownRow}>
          {[
            { label: 'HRS', value: countdown.hrs },
            { label: 'MIN', value: countdown.mins },
            { label: 'SEC', value: countdown.secs },
          ].map((c) => (
            <View key={c.label} style={styles.countCell}>
              <Text style={styles.countValue}>{c.value}</Text>
              <Text style={styles.countLabel}>{c.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bidSummary}>
          <Text style={styles.currentLabel}>Current highest</Text>
          <Text style={styles.currentBid}>${auction.currentBid.toFixed(2)}/kg</Text>
          <Text style={styles.total}>
            Total ≈ ${(auction.currentBid * qty).toLocaleString()}
          </Text>
        </View>

        <TextInput
          style={styles.bidInput}
          value={bidAmount}
          onChangeText={setBidAmount}
          keyboardType="decimal-pad"
          placeholder="Your bid"
          placeholderTextColor={colors.textMuted}
        />

        <View style={styles.chips}>
          {quickBids.map((q) => (
            <Pressable
              key={q}
              style={[styles.chip, bidAmount === q && styles.chipActive]}
              onPress={() => setBidAmount(q)}
            >
              <Text style={[styles.chipText, bidAmount === q && styles.chipTextActive]}>
                ${q}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.autoBidRow}>
          <Text style={styles.autoBidLabel}>Auto-Bid</Text>
          <Switch
            value={autoBid}
            onValueChange={setAutoBid}
            trackColor={{ true: colors.navy2, false: colors.lavender }}
          />
        </View>

        <Button
          title={placed ? '✓ Bid Placed' : 'Bid Now'}
          variant={placed ? 'green' : 'primary'}
          onPress={handleBid}
          loading={bidding}
        />

        <Text style={styles.historyTitle}>Bid History</Text>
        {auction.bids.map((item, index) => (
          <View key={item.id} style={[styles.bidRow, index === 0 && styles.topBid]}>
            <Text style={styles.bidder}>
              {index === 0 ? '👑 ' : ''}
              {item.bidderName}
            </Text>
            <Text style={styles.bidAmount}>${item.amount.toFixed(2)}</Text>
          </View>
        ))}
      </ScreenScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.lavender },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lavender,
  },
  top: {
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  liveBadge: {
    backgroundColor: colors.red,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  liveText: {
    fontFamily: fonts.displaySemi,
    fontSize: 11,
    color: colors.white,
  },
  hero: {
    alignSelf: 'center',
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  lotName: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    color: colors.white,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  lotMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 6,
  },
  content: { padding: 20 },
  countdownRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  countCell: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  countValue: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: colors.navy,
  },
  countLabel: {
    fontFamily: fonts.displaySemi,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: 1,
  },
  bidSummary: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  currentLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  currentBid: {
    fontFamily: fonts.displayExtra,
    fontSize: 32,
    color: colors.navy,
    marginTop: 4,
  },
  total: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  bidInput: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    fontSize: 22,
    fontFamily: fonts.display,
    textAlign: 'center',
    marginBottom: 12,
    color: colors.navy,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.navy },
  chipText: {
    fontFamily: fonts.displayMedium,
    fontSize: 13,
    color: colors.navy,
  },
  chipTextActive: { color: colors.white },
  autoBidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  autoBidLabel: {
    fontFamily: fonts.displayMedium,
    fontSize: 15,
    color: colors.navy,
  },
  historyTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.navy,
    marginTop: 24,
    marginBottom: 12,
  },
  bidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 8,
  },
  topBid: { borderWidth: 2, borderColor: colors.amber },
  bidder: {
    fontFamily: fonts.displayMedium,
    fontSize: 14,
    color: colors.navy,
  },
  bidAmount: {
    fontFamily: fonts.displaySemi,
    fontSize: 14,
    color: colors.navy2,
  },
});
