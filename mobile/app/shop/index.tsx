import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api, formatUGX, Product, ShopChannel } from '../../src/api/client';
import { Card } from '../../src/components/Card';
import { FilterChips } from '../../src/components/FilterChips';
import { useShopBag } from '../../src/context/ShopBagContext';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';

const CHANNEL_FILTERS: { label: string; value: ShopChannel | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Tour take-home', value: 'tourism' },
  { label: 'Diaspora gifts', value: 'diaspora' },
  { label: 'Wholesale (B2B)', value: 'b2b' },
];

export default function ShopScreen() {
  const { addItem, itemCount } = useShopBag();
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const channel = CHANNEL_FILTERS.find((f) => f.label === filter)?.value;
      const result = await api.shop.products.list(
        channel && channel !== 'all' ? channel : undefined,
      );
      setProducts(result);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.intro}>
        <Text style={styles.introText}>
          Roasted, branded coffee — straight from the farm. Take it home from a
          tour, ship it to the diaspora, or order wholesale for your café.
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <FilterChips
          options={CHANNEL_FILTERS.map((f) => f.label)}
          value={filter}
          onChange={setFilter}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.navy} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/shop/${item.id}`)}>
              <Card style={styles.card}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.meta} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <Text style={styles.price}>{formatUGX(item.priceUgx)}</Text>
                  </View>
                  <Pressable
                    style={styles.addBtn}
                    onPress={() => addItem(item)}
                    hitSlop={8}
                  >
                    <Ionicons name="add" size={20} color={colors.white} />
                  </Pressable>
                </View>
              </Card>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No products in this category yet.</Text>
          }
        />
      )}

      {itemCount > 0 && (
        <Pressable style={styles.bagBar} onPress={() => router.push('/shop/bag')}>
          <Ionicons name="bag-handle-outline" size={18} color={colors.white} />
          <Text style={styles.bagBarText}>
            View bag ({itemCount} item{itemCount > 1 ? 's' : ''})
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  intro: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  introText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  list: { padding: 16, paddingBottom: 96 },
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontFamily: fonts.displaySemi, fontSize: 15, color: colors.navy },
  meta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  price: {
    fontFamily: fonts.displaySemi,
    fontSize: 15,
    color: colors.navy2,
    marginTop: 8,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  bagBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: colors.navy,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bagBarText: {
    color: colors.white,
    fontFamily: fonts.displaySemi,
    fontSize: 14,
  },
});
