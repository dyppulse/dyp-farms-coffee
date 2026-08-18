import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, CartItem, formatUGX, Shipment } from '../../src/api/client';
import { Card } from '../../src/components/Card';
import { ScreenScrollView } from '../../src/components/ScreenScrollView';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { StatusPill } from '../../src/components/StatusPill';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('active');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cartData, shipData] = await Promise.all([
        api.lots.getCart().catch(() => []),
        api.logistics.list().catch(() => []),
      ]);
      setCart(cartData);
      setShipments(shipData);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const activeShipments = shipments.filter((s) => s.status !== 'delivered');
  const completedShipments = shipments.filter((s) => s.status === 'delivered');

  return (
    <ScreenScrollView
      inTabs
      style={[styles.container, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Orders</Text>
      <SegmentedControl
        options={[
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.navy} style={{ marginTop: 40 }} />
      ) : (
        <View style={{ marginTop: 16 }}>
          {tab === 'active' ? (
            <>
              {cart.length > 0 ? (
                <Pressable onPress={() => router.push('/cart')}>
                  <Card style={styles.card}>
                    <Text style={styles.orderId}>CART</Text>
                    <Text style={styles.orderName}>
                      {cart.length} lot{cart.length === 1 ? '' : 's'} in cart
                    </Text>
                    <Text style={styles.orderMeta}>
                      {formatUGX(
                        cart.reduce((sum, i) => sum + i.lot.price * i.quantity, 0),
                      )}
                    </Text>
                    <StatusPill label="Pending checkout" color={colors.amber} />
                  </Card>
                </Pressable>
              ) : null}
              {activeShipments.map((s) => (
                <Pressable key={s.id} onPress={() => router.push(`/logistics/${s.id}`)}>
                  <Card style={styles.card}>
                    <Text style={styles.orderId}>ORD-{s.lotNumber}</Text>
                    <Text style={styles.orderName}>Lot #{s.lotNumber}</Text>
                    <StatusPill
                      label={s.status === 'in_transit' ? 'In Transit' : s.status}
                      color={colors.navy2}
                      style={{ marginTop: 8 }}
                    />
                    <View style={styles.actions}>
                      <Text style={styles.link}>Track Shipment →</Text>
                    </View>
                  </Card>
                </Pressable>
              ))}
              {cart.length === 0 && activeShipments.length === 0 ? (
                <Card>
                  <Text style={styles.empty}>No active orders</Text>
                </Card>
              ) : null}
            </>
          ) : (
            <>
              {completedShipments.map((s) => (
                <Pressable key={s.id} onPress={() => router.push(`/logistics/${s.id}`)}>
                  <Card style={styles.card}>
                    <Text style={styles.orderId}>ORD-{s.lotNumber}</Text>
                    <Text style={styles.orderName}>Lot #{s.lotNumber}</Text>
                    <StatusPill label="Delivered" color={colors.green} style={{ marginTop: 8 }} />
                  </Card>
                </Pressable>
              ))}
              {completedShipments.length === 0 ? (
                <Card>
                  <Text style={styles.empty}>No completed orders yet</Text>
                </Card>
              ) : null}
            </>
          )}
        </View>
      )}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lavender },
  content: { padding: 20 },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.navy,
    marginBottom: 16,
  },
  card: { marginBottom: 12 },
  orderId: {
    fontFamily: fonts.displaySemi,
    fontSize: 12,
    color: colors.navy2,
    letterSpacing: 0.8,
  },
  orderName: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.navy,
    marginTop: 4,
  },
  orderMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginVertical: 8,
  },
  actions: { marginTop: 12 },
  link: {
    fontFamily: fonts.displaySemi,
    fontSize: 13,
    color: colors.navy2,
  },
  empty: {
    fontFamily: fonts.body,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
