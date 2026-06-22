import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api, Auction } from '../../src/api/client';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { useScreenInsets } from '../../src/hooks/useScreenInsets';
import { colors } from '../../src/theme/colors';

export default function AuctionScreen() {
  const { lotId } = useLocalSearchParams<{ lotId: string }>();
  const { contentBottom } = useScreenInsets();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [autoBid, setAutoBid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const load = useCallback(async () => {
    if (!lotId) return;
    try {
      const result = await api.auctions.get(lotId);
      setAuction(result);
      setBidAmount(String(result.currentBid + 100));
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
      const diff = new Date(auction.endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Ended');
        clearInterval(interval);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [auction]);

  async function handleBid() {
    const amount = parseFloat(bidAmount);
    if (!amount || !lotId) return;
    setBidding(true);
    try {
      await api.auctions.bid(lotId, amount, autoBid);
      await load();
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: contentBottom }]}>
      <Card style={styles.headerCard}>
        <Text style={styles.lotName}>{auction.lot?.name ?? 'Coffee Lot'}</Text>
        <Text style={styles.currentBid}>${auction.currentBid.toLocaleString()}</Text>
        <Text style={styles.timer}>{timeLeft}</Text>
      </Card>

      <TextInput
        style={styles.bidInput}
        value={bidAmount}
        onChangeText={setBidAmount}
        keyboardType="decimal-pad"
        placeholder="Enter bid amount"
        placeholderTextColor={colors.textSecondary}
      />

      <View style={styles.autoBidRow}>
        <Text style={styles.autoBidLabel}>Auto-Bid</Text>
        <Switch
          value={autoBid}
          onValueChange={setAutoBid}
          trackColor={{ true: colors.primary }}
        />
      </View>

      <Button title="PLACE BID" onPress={handleBid} loading={bidding} />

      <Text style={styles.historyTitle}>Bid History</Text>
      <FlatList
        data={auction.bids}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={[styles.bidRow, index === 0 && styles.topBid]}>
            <Text style={styles.bidder}>{item.bidderName}</Text>
            <Text style={styles.bidAmount}>${item.amount.toLocaleString()}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: { alignItems: 'center', marginBottom: 20, backgroundColor: colors.primary },
  lotName: { color: colors.accent, fontSize: 14 },
  currentBid: { color: colors.white, fontSize: 40, fontWeight: '700', marginTop: 4 },
  timer: { color: colors.white, fontSize: 24, fontWeight: '600', marginTop: 8 },
  bidInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  autoBidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  autoBidLabel: { fontSize: 16, fontWeight: '500', color: colors.text },
  historyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 24, marginBottom: 12 },
  bidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 6,
  },
  topBid: { borderWidth: 2, borderColor: colors.accent },
  bidder: { fontSize: 14, color: colors.text },
  bidAmount: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
