import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api, formatUGX, Product } from '../../src/api/client';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { ScreenScrollView } from '../../src/components/ScreenScrollView';
import { useShopBag } from '../../src/context/ShopBagContext';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';

function param(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = param(id);
  const { addItem } = useShopBag();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    api.shop.products
      .get(productId)
      .then((p) => {
        setProduct(p);
        setQuantity(p.minOrderQty || 1);
      })
      .catch((e) => Alert.alert('Error', (e as Error).message))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.meta}>Product not found.</Text>
      </View>
    );
  }

  function decrement() {
    setQuantity((q) => Math.max(product!.minOrderQty || 1, q - 1));
  }

  function increment() {
    setQuantity((q) => q + 1);
  }

  return (
    <ScreenScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.name}>{product.name}</Text>
        {product.roastLevel && (
          <Text style={styles.roast}>{product.roastLevel} roast</Text>
        )}
        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.specsRow}>
          {product.weightGrams && (
            <Text style={styles.spec}>
              {product.weightGrams >= 1000
                ? `${product.weightGrams / 1000}kg`
                : `${product.weightGrams}g`}
            </Text>
          )}
          <Text style={styles.spec}>per {product.unit}</Text>
          {product.minOrderQty > 1 && (
            <Text style={styles.spec}>Min order: {product.minOrderQty}</Text>
          )}
        </View>

        <Text style={styles.price}>{formatUGX(product.priceUgx)}</Text>
      </Card>

      <Card style={styles.qtyCard}>
        <Text style={styles.qtyLabel}>Quantity</Text>
        <View style={styles.qtyRow}>
          <Pressable style={styles.qtyBtn} onPress={decrement}>
            <Text style={styles.qtyBtnText}>−</Text>
          </Pressable>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <Pressable style={styles.qtyBtn} onPress={increment}>
            <Text style={styles.qtyBtnText}>+</Text>
          </Pressable>
        </View>
        <Text style={styles.lineTotal}>
          Subtotal: {formatUGX(product.priceUgx * quantity)}
        </Text>
      </Card>

      <Button
        title="Add to bag"
        onPress={() => {
          addItem(product, quantity);
          Alert.alert('Added to bag', product.name, [
            { text: 'Keep shopping', style: 'cancel' },
            { text: 'View bag', onPress: () => router.push('/shop/bag') },
          ]);
        }}
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.displayExtra, fontSize: 20, color: colors.navy },
  roast: {
    fontFamily: fonts.displayMedium,
    fontSize: 13,
    color: colors.navy2,
    marginTop: 2,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 20,
  },
  specsRow: { flexDirection: 'row', gap: 12, marginTop: 12, flexWrap: 'wrap' },
  spec: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    backgroundColor: colors.lavender,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  price: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: colors.navy,
    marginTop: 16,
  },
  qtyCard: { alignItems: 'center' },
  qtyLabel: { fontFamily: fonts.displayMedium, fontSize: 13, color: colors.navy },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 10,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 20, color: colors.navy, fontFamily: fonts.displaySemi },
  qtyValue: { fontSize: 18, fontFamily: fonts.displaySemi, color: colors.navy },
  lineTotal: {
    fontFamily: fonts.displayMedium,
    fontSize: 14,
    color: colors.navy2,
    marginTop: 12,
  },
  meta: { fontFamily: fonts.body, color: colors.textSecondary },
});
