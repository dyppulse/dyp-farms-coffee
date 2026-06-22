import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api, CoffeeLot } from '../../src/api/client';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { useScreenInsets } from '../../src/hooks/useScreenInsets';
import { colors } from '../../src/theme/colors';

export default function MarketplaceScreen() {
  const { contentBottom } = useScreenInsets({ inTabs: true });
  const [lots, setLots] = useState<CoffeeLot[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const result = await api.lots.list(query);
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

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Dyp Farms Coffee Marketplace</Text>
        <Pressable onPress={() => router.push('/cart')} style={styles.cartBtn}>
          <Ionicons name="cart-outline" size={26} color={colors.primary} />
        </Pressable>
      </View>
      <TextInput
        style={styles.search}
        placeholder="Search coffee lots..."
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={() => load(search)}
        returnKeyType="search"
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={lots}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: contentBottom }]}
          renderItem={({ item }) => (
            <Card style={styles.lotCard}>
              <Pressable onPress={() => router.push(`/lot/${item.id}`)}>
                <View style={styles.lotHeader}>
                  <Text style={styles.lotName}>{item.name}</Text>
                  <Text style={styles.lotGrade}>{item.grade}</Text>
                </View>
                <Text style={styles.lotOrigin}>{item.origin}</Text>
                <Text style={styles.lotNotes} numberOfLines={2}>
                  Cupping Notes: {item.cuppingNotes}
                </Text>
                <Text style={styles.lotPrice}>${item.price}/kg</Text>
              </Pressable>
              <View style={styles.actions}>
                <Button
                  title="Add to Cart"
                  onPress={() => handleAddToCart(item.id)}
                  style={styles.actionBtn}
                />
                {item.inAuction && (
                  <Button
                    title="Join Auction"
                    variant="secondary"
                    onPress={() => router.push(`/auction/${item.id}`)}
                    style={styles.actionBtn}
                  />
                )}
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, flex: 1 },
  cartBtn: { padding: 4 },
  search: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  list: { paddingTop: 0 },
  lotCard: { marginBottom: 12 },
  lotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lotName: { fontSize: 18, fontWeight: '600', color: colors.text },
  lotGrade: { fontSize: 12, fontWeight: '600', color: colors.primary, backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  lotOrigin: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  lotNotes: { fontSize: 13, color: colors.textSecondary, marginTop: 8, fontStyle: 'italic' },
  lotPrice: { fontSize: 18, fontWeight: '700', color: colors.secondary, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 10 },
});
