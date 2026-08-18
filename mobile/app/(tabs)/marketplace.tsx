import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, CoffeeLot } from '../../src/api/client';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { FilterChips } from '../../src/components/FilterChips';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { useScreenInsets } from '../../src/hooks/useScreenInsets';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const { contentBottom } = useScreenInsets({ inTabs: true });
  const [lots, setLots] = useState<CoffeeLot[]>([]);
  const [mode, setMode] = useState('browse');
  const [filter, setFilter] = useState('Origin');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.lots.list();
      setLots(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleAddToCart(lotId: string) {
    try {
      await api.lots.addToCart(lotId);
      Alert.alert('Added', 'Lot added to cart');
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  }

  const displayed =
    mode === 'auctions' ? lots.filter((l) => l.inAuction) : lots;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Marketplace</Text>
        <Pressable onPress={() => router.push('/cart')} style={styles.cartBtn}>
          <Ionicons name="cart-outline" size={24} color={colors.navy} />
        </Pressable>
      </View>

      <SegmentedControl
        options={[
          { key: 'browse', label: '🛒 Browse Lots' },
          { key: 'auctions', label: '⚡ Live Auctions' },
        ]}
        value={mode}
        onChange={setMode}
      />

      <View style={{ marginVertical: 12 }}>
        <FilterChips
          options={['Origin', 'Grade', 'Price', 'Qty']}
          value={filter}
          onChange={setFilter}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.navy} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: contentBottom }}
          ListEmptyComponent={
            <Card>
              <Text style={styles.empty}>No lots in this view</Text>
            </Card>
          }
          renderItem={({ item }) => (
            <Card style={styles.lotCard}>
              <Pressable onPress={() => router.push(`/lot/${item.id}`)}>
                <View style={styles.hero}>
                  <Text style={styles.heroEmoji}>☕</Text>
                  {item.inAuction ? (
                    <View style={styles.liveBadge}>
                      <Text style={styles.liveBadgeText}>LIVE AUCTION</Text>
                    </View>
                  ) : null}
                  <View style={styles.gradeBadge}>
                    <Text style={styles.gradeBadgeText}>{item.grade}</Text>
                  </View>
                </View>
                <Text style={styles.lotName}>{item.name}</Text>
                <Text style={styles.lotOrigin}>
                  {item.origin} · {item.quantity}
                  {item.unit}
                </Text>
                <Text style={styles.lotNotes} numberOfLines={2}>
                  {item.cuppingNotes}
                </Text>
                <Text style={styles.lotPrice}>${item.price}/kg</Text>
              </Pressable>
              <View style={styles.actions}>
                {item.inAuction ? (
                  <Button
                    title="Join Auction"
                    onPress={() => router.push(`/auction/${item.id}`)}
                    style={styles.actionBtn}
                  />
                ) : (
                  <Button
                    title="Buy Now"
                    onPress={() => handleAddToCart(item.id)}
                    style={styles.actionBtn}
                  />
                )}
                <Button
                  title="Add to Cart"
                  variant="outline"
                  onPress={() => handleAddToCart(item.id)}
                  style={styles.actionBtn}
                />
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: colors.lavender },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.navy,
  },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lotCard: { marginBottom: 14 },
  hero: {
    height: 120,
    borderRadius: 16,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  heroEmoji: { fontSize: 48 },
  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.red,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveBadgeText: {
    fontFamily: fonts.displaySemi,
    fontSize: 10,
    color: colors.white,
  },
  gradeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.navy2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gradeBadgeText: {
    fontFamily: fonts.displaySemi,
    fontSize: 11,
    color: colors.white,
  },
  lotName: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.navy,
  },
  lotOrigin: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  lotNotes: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
    fontStyle: 'italic',
  },
  lotPrice: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    color: colors.navy2,
    marginTop: 8,
  },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1 },
  empty: {
    fontFamily: fonts.body,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
