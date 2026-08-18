import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, CartItem } from '../src/api/client';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { ScreenScrollView } from '../src/components/ScreenScrollView';
import { colors } from '../src/theme/colors';
import { fonts } from '../src/theme/typography';

export default function CartScreen() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cart = await api.lots.getCart();
      setItems(cart);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const total = items.reduce(
    (sum, item) => sum + item.lot.price * item.quantity,
    0,
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
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {items.length === 0 ? (
        <Card>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>
            Browse the marketplace and add coffee lots to your cart.
          </Text>
          <Button
            title="Browse Marketplace"
            onPress={() => router.push('/(tabs)/marketplace')}
            style={{ marginTop: 16 }}
          />
        </Card>
      ) : (
        <>
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/lot/${item.lotId}`)}
            >
              <Card style={styles.itemCard}>
                <Text style={styles.lotName}>{item.lot.name}</Text>
                <Text style={styles.lotMeta}>
                  Lot #{item.lot.lotNumber} · {item.lot.grade}
                </Text>
                <View style={styles.row}>
                  <Text style={styles.qty}>Qty: {item.quantity} kg</Text>
                  <Text style={styles.price}>
                    ${(item.lot.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))}
          <Card style={styles.totalCard}>
            <Text style={styles.totalLabel}>Estimated total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </Card>
          <Button
            title="Continue Shopping"
            variant="outline"
            onPress={() => router.push('/(tabs)/marketplace')}
            style={{ marginBottom: 12 }}
          />
        </>
      )}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lavender },
  content: { padding: 16 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lavender,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.navy,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  itemCard: { marginBottom: 12 },
  lotName: {
    fontFamily: fonts.displaySemi,
    fontSize: 16,
    color: colors.navy,
  },
  lotMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  qty: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.navy,
  },
  price: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.navy2,
  },
  totalCard: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: colors.navy,
  },
  totalLabel: {
    fontFamily: fonts.displayMedium,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
  },
  totalValue: {
    fontFamily: fonts.displayExtra,
    color: colors.white,
    fontSize: 28,
    marginTop: 4,
  },
});
