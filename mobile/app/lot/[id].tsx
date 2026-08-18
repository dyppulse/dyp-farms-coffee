import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { api, CoffeeLot } from '../../src/api/client';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { ScreenScrollView } from '../../src/components/ScreenScrollView';
import { StatusPill } from '../../src/components/StatusPill';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';

export default function LotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [lot, setLot] = useState<CoffeeLot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.lots.get(id).then(setLot).finally(() => setLoading(false));
    }
  }, [id]);

  async function handleAddToCart() {
    if (!lot) return;
    try {
      await api.lots.addToCart(lot.id);
      Alert.alert('Added', 'Lot added to cart');
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  }

  if (loading || !lot) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <ScreenScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Card>
        <View style={styles.hero}>
          <Text style={{ fontSize: 48 }}>☕</Text>
          {lot.inAuction ? (
            <StatusPill label="LIVE AUCTION" color={colors.red} style={styles.badge} />
          ) : null}
        </View>
        <Text style={styles.name}>{lot.name}</Text>
        <Text style={styles.lotNumber}>Lot #{lot.lotNumber}</Text>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Origin</Text>
            <Text style={styles.value}>{lot.origin}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Grade</Text>
            <Text style={styles.value}>{lot.grade}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Price</Text>
            <Text style={styles.price}>${lot.price}/kg</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Quantity</Text>
            <Text style={styles.value}>
              {lot.quantity} {lot.unit}
            </Text>
          </View>
        </View>

        <Text style={styles.label}>Cupping Notes</Text>
        <Text style={styles.notes}>{lot.cuppingNotes}</Text>

        <Text style={styles.label}>Traceability</Text>
        <Text style={styles.value}>{lot.traceability}</Text>
      </Card>

      <View style={styles.actions}>
        <Button title="Add to Cart" onPress={handleAddToCart} />
        {lot.inAuction ? (
          <Button
            title="Join Auction"
            variant="secondary"
            onPress={() => router.push(`/auction/${lot.id}`)}
            style={{ marginTop: 10 }}
          />
        ) : null}
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lavender },
  scrollContent: { padding: 16 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lavender,
  },
  hero: {
    height: 120,
    borderRadius: 16,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badge: { position: 'absolute', top: 10, left: 10 },
  name: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: colors.navy,
  },
  lotNumber: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  field: { flex: 1 },
  label: {
    fontFamily: fonts.displaySemi,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 8,
  },
  value: {
    fontFamily: fonts.displayMedium,
    fontSize: 15,
    color: colors.navy,
  },
  price: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    color: colors.navy2,
  },
  notes: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  actions: { marginTop: 16 },
});
