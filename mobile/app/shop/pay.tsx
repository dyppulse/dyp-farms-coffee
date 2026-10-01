import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, formatUGX, ShopChannel } from '../../src/api/client';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { ScreenScrollView } from '../../src/components/ScreenScrollView';
import { useShopBag } from '../../src/context/ShopBagContext';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';

type PaymentMethod = 'mtn_momo' | 'airtel_money';

function param(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : (value ?? '');
}

const METHODS: { id: PaymentMethod; label: string; color: string }[] = [
  { id: 'mtn_momo', label: 'MTN Mobile Money', color: '#FFCC00' },
  { id: 'airtel_money', label: 'Airtel Money', color: '#ED1C24' },
];

export default function ShopPayScreen() {
  const params = useLocalSearchParams<{
    channel: string;
    deliveryMethod: string;
    deliveryAddress?: string;
  }>();
  const channel = param(params.channel) as ShopChannel;
  const deliveryMethod = param(params.deliveryMethod) as 'pickup' | 'shipping';
  const deliveryAddress = param(params.deliveryAddress);

  const { lines, subtotal, clear } = useShopBag();
  const [method, setMethod] = useState<PaymentMethod>('mtn_momo');
  const [phone, setPhone] = useState('+256');
  const [loading, setLoading] = useState(false);
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([
    'mtn_momo',
    'airtel_money',
  ]);

  useEffect(() => {
    api.wallet
      .paymentMethods()
      .then((r) => {
        if (r.methods.length > 0) setAvailableMethods(r.methods);
      })
      .catch(() => {});
  }, []);

  async function handlePay() {
    if (phone.length < 10) {
      Alert.alert('Error', 'Enter a valid phone number');
      return;
    }
    if (lines.length === 0) {
      Alert.alert('Your bag is empty');
      router.replace('/shop');
      return;
    }
    setLoading(true);
    try {
      const result = await api.shop.orders.create({
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        channel,
        deliveryMethod,
        deliveryAddress: deliveryAddress || undefined,
        paymentMethod: method,
        phoneNumber: phone,
      });
      clear();
      router.replace(`/shop/order/${result.orderId}`);
    } catch (e) {
      Alert.alert('Payment failed', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const visibleMethods = METHODS.filter((m) => availableMethods.includes(m.id));

  return (
    <ScreenScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Payment</Text>
      <Text style={styles.subtitle}>
        Approve the payment on your phone when prompted.
      </Text>

      <Text style={styles.sectionLabel}>Payment method</Text>
      {visibleMethods.map((m) => (
        <Pressable
          key={m.id}
          onPress={() => setMethod(m.id)}
          style={[styles.methodCard, method === m.id && styles.methodSelected]}
        >
          <View style={[styles.methodDot, { backgroundColor: m.color }]} />
          <Text style={[styles.methodLabel, method === m.id && styles.methodLabelSelected]}>
            {m.label}
          </Text>
        </Pressable>
      ))}

      <Input
        label="Mobile money number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="+2567XXXXXXXX"
      />

      <Card style={styles.summary}>
        <Text style={styles.summaryTitle}>Order summary</Text>
        {lines.map((l) => (
          <View key={l.product.id} style={styles.summaryRow}>
            <Text style={styles.summaryItem} numberOfLines={1}>
              {l.quantity} × {l.product.name}
            </Text>
            <Text style={styles.summaryAmount}>
              {formatUGX(l.product.priceUgx * l.quantity)}
            </Text>
          </View>
        ))}
        <View style={[styles.summaryRow, { marginTop: 6 }]}>
          <Text style={styles.summaryTotal}>Subtotal</Text>
          <Text style={styles.summaryTotal}>{formatUGX(subtotal)}</Text>
        </View>
      </Card>

      <Card style={styles.note}>
        <Text style={styles.noteText}>
          You will receive a prompt on your phone to enter your PIN and confirm the payment.
        </Text>
      </Card>

      <Button title="Pay now" onPress={handlePay} loading={loading} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 8,
    gap: 12,
  },
  methodSelected: { borderColor: colors.primary, backgroundColor: '#e8f5ee' },
  methodDot: { width: 12, height: 12, borderRadius: 6 },
  methodLabel: { fontSize: 15, color: colors.text },
  methodLabelSelected: { fontWeight: '600', color: colors.primary },
  summary: { marginVertical: 12 },
  summaryTitle: { fontFamily: fonts.displaySemi, fontSize: 13, color: colors.navy, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, gap: 8 },
  summaryItem: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  summaryAmount: { fontFamily: fonts.body, fontSize: 13, color: colors.navy },
  summaryTotal: { fontFamily: fonts.displaySemi, fontSize: 14, color: colors.navy },
  note: { marginVertical: 16, backgroundColor: '#f0f7f4' },
  noteText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
});
