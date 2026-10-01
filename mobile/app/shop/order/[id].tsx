import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { api, formatUGX, ShopOrder } from '../../../src/api/client';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { ScreenScrollView } from '../../../src/components/ScreenScrollView';
import { colors } from '../../../src/theme/colors';

function param(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function ShopOrderConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = param(id);
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!orderId) return;

    async function poll() {
      try {
        const o = await api.shop.orders.poll(orderId!);
        setOrder(o);
        if (o.status !== 'pending_payment' && pollRef.current) {
          clearInterval(pollRef.current);
        }
      } catch {
        // keep polling
      }
    }

    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId]);

  if (!order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.waiting}>Processing payment…</Text>
        <Text style={styles.hint}>Check your phone to approve the payment.</Text>
      </View>
    );
  }

  if (order.status === 'pending_payment') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.waiting}>Waiting for payment approval</Text>
        <Text style={styles.hint}>Total: {formatUGX(order.totalAmount)}</Text>
        <Text style={styles.hint}>Check your phone to approve the payment.</Text>
      </View>
    );
  }

  if (order.status !== 'confirmed' && order.status !== 'fulfilled') {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Order {order.status}</Text>
        <Text style={styles.hint}>Payment was not completed. Please try again.</Text>
        <Button title="Back to shop" onPress={() => router.replace('/shop')} />
      </View>
    );
  }

  return (
    <ScreenScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.confirmed}>Order confirmed!</Text>

      <Card style={styles.summaryCard}>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.quantity} × {item.product.name}
            </Text>
            <Text style={styles.itemAmount}>{formatUGX(item.lineTotal)}</Text>
          </View>
        ))}
        <View style={[styles.itemRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total paid</Text>
          <Text style={styles.totalValue}>{formatUGX(order.totalAmount)}</Text>
        </View>
        <Text style={styles.delivery}>
          {order.deliveryMethod === 'pickup'
            ? 'Pickup at the farm'
            : `Shipping to ${order.deliveryAddress}`}
        </Text>
      </Card>

      <Text style={styles.emailNote}>
        A receipt has been sent to your registered email.
      </Text>

      <Button title="Done" onPress={() => router.replace('/shop')} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  waiting: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 16 },
  hint: { fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
  errorTitle: { fontSize: 20, fontWeight: '700', color: colors.error },
  confirmed: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 16 },
  summaryCard: { backgroundColor: colors.primary, marginBottom: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, gap: 8 },
  itemName: { flex: 1, color: colors.white, fontSize: 14 },
  itemAmount: { color: colors.white, fontSize: 14 },
  totalRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)' },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '600' },
  totalValue: { color: colors.white, fontSize: 16, fontWeight: '700' },
  delivery: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 10 },
  emailNote: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
});
