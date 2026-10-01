import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatUGX, ShopChannel } from '../../src/api/client';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { ScreenScrollView } from '../../src/components/ScreenScrollView';
import { useShopBag } from '../../src/context/ShopBagContext';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';

type Delivery = 'pickup' | 'shipping';

const SHIPPING_FEE_UGX = 15000;

// A line's channel isn't tracked per-product in the bag UI — the shopper picks
// one storefront context for the whole order (matches how the backend bills
// shipping/wholesale terms per order, not per line item).
const CHANNELS: { label: string; value: ShopChannel }[] = [
  { label: 'Farm visit pickup', value: 'tourism' },
  { label: 'Diaspora / overseas', value: 'diaspora' },
  { label: 'Wholesale (café/retailer)', value: 'b2b' },
  { label: 'General', value: 'direct' },
];

export default function BagScreen() {
  const { lines, setQuantity, removeItem, subtotal } = useShopBag();
  const [channel, setChannel] = useState<ShopChannel>('tourism');
  const [delivery, setDelivery] = useState<Delivery>('pickup');
  const [address, setAddress] = useState('');

  const deliveryFee = delivery === 'shipping' ? SHIPPING_FEE_UGX : 0;
  const total = subtotal + deliveryFee;

  function handleCheckout() {
    if (lines.length === 0) return;
    if (delivery === 'shipping' && address.trim().length < 5) {
      Alert.alert('Delivery address required', 'Enter where we should ship your order.');
      return;
    }
    router.push({
      pathname: '/shop/pay',
      params: {
        channel,
        deliveryMethod: delivery,
        deliveryAddress: delivery === 'shipping' ? address.trim() : '',
      },
    });
  }

  if (lines.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Your bag is empty</Text>
        <Text style={styles.meta}>Add coffee from the shop to get started.</Text>
        <Button
          title="Browse the shop"
          onPress={() => router.push('/shop')}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  return (
    <ScreenScrollView style={styles.container} contentContainerStyle={styles.content}>
      {lines.map((line) => (
        <Card key={line.product.id} style={styles.lineCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.lineName}>{line.product.name}</Text>
            <Text style={styles.linePrice}>{formatUGX(line.product.priceUgx)} each</Text>
          </View>
          <View style={styles.qtyRow}>
            <Pressable
              style={styles.qtyBtn}
              onPress={() => setQuantity(line.product.id, line.quantity - 1)}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </Pressable>
            <Text style={styles.qtyValue}>{line.quantity}</Text>
            <Pressable
              style={styles.qtyBtn}
              onPress={() => setQuantity(line.product.id, line.quantity + 1)}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => removeItem(line.product.id)} hitSlop={8}>
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        </Card>
      ))}

      <Text style={styles.sectionLabel}>I'm buying as</Text>
      <View style={styles.chipsRow}>
        {CHANNELS.map((c) => (
          <Pressable
            key={c.value}
            onPress={() => setChannel(c.value)}
            style={[styles.chip, channel === c.value && styles.chipActive]}
          >
            <Text style={[styles.chipText, channel === c.value && styles.chipTextActive]}>
              {c.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Delivery</Text>
      <View style={styles.chipsRow}>
        {(['pickup', 'shipping'] as Delivery[]).map((d) => (
          <Pressable
            key={d}
            onPress={() => setDelivery(d)}
            style={[styles.chip, delivery === d && styles.chipActive]}
          >
            <Text style={[styles.chipText, delivery === d && styles.chipTextActive]}>
              {d === 'pickup' ? 'Pickup at the farm' : `Shipping (${formatUGX(SHIPPING_FEE_UGX)})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {delivery === 'shipping' && (
        <Input
          label="Delivery address"
          value={address}
          onChangeText={setAddress}
          placeholder="Street, city, country"
          multiline
        />
      )}

      <Card style={styles.totalCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValueSmall}>{formatUGX(subtotal)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Delivery</Text>
          <Text style={styles.totalValueSmall}>{formatUGX(deliveryFee)}</Text>
        </View>
        <View style={[styles.totalRow, { marginTop: 8 }]}>
          <Text style={styles.totalLabelBig}>Total</Text>
          <Text style={styles.totalValue}>{formatUGX(total)}</Text>
        </View>
      </Card>

      <Button title="Continue to payment" onPress={handleCheckout} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.navy },
  meta: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  lineCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lineName: { fontFamily: fonts.displaySemi, fontSize: 14, color: colors.navy },
  linePrice: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 16, color: colors.navy, fontFamily: fonts.displaySemi },
  qtyValue: { fontSize: 15, fontFamily: fonts.displaySemi, color: colors.navy, minWidth: 18, textAlign: 'center' },
  remove: { fontFamily: fonts.body, fontSize: 12, color: colors.error },
  sectionLabel: {
    fontFamily: fonts.displaySemi,
    fontSize: 13,
    color: colors.navy,
    marginTop: 8,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.lavender,
  },
  chipActive: { backgroundColor: colors.navy },
  chipText: { fontSize: 13, fontFamily: fonts.displayMedium, color: colors.navy },
  chipTextActive: { color: colors.white },
  totalCard: { backgroundColor: colors.navy, marginTop: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { color: 'rgba(255,255,255,0.75)', fontFamily: fonts.body, fontSize: 13 },
  totalLabelBig: { color: colors.white, fontFamily: fonts.displayMedium, fontSize: 14 },
  totalValueSmall: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.body, fontSize: 13 },
  totalValue: { color: colors.white, fontFamily: fonts.displayExtra, fontSize: 20 },
});
