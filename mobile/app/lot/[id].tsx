import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { api, CoffeeLot } from '../../src/api/client';
import { Button } from '../../src/components/Button';
import { ScreenScrollView } from '../../src/components/ScreenScrollView';
import { Card } from '../../src/components/Card';
import { colors } from '../../src/theme/colors';

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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScreenScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Card>
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
            <Text style={styles.value}>{lot.quantity} {lot.unit}</Text>
          </View>
        </View>

        <Text style={styles.label}>Cupping Notes</Text>
        <Text style={styles.notes}>{lot.cuppingNotes}</Text>

        <Text style={styles.label}>Traceability</Text>
        <Text style={styles.value}>{lot.traceability}</Text>
      </Card>

      <View style={styles.actions}>
        <Button title="Add to Cart" onPress={handleAddToCart} />
        {lot.inAuction && (
          <Button
            title="Join Auction"
            variant="secondary"
            onPress={() => router.push(`/auction/${lot.id}`)}
            style={{ marginTop: 12 }}
          />
        )}
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 24, fontWeight: '700', color: colors.text },
  lotNumber: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  row: { flexDirection: 'row', gap: 16, marginTop: 16 },
  field: { flex: 1 },
  label: { fontSize: 12, color: colors.textSecondary, marginTop: 12, marginBottom: 4 },
  value: { fontSize: 16, fontWeight: '500', color: colors.text },
  price: { fontSize: 20, fontWeight: '700', color: colors.secondary },
  notes: { fontSize: 15, color: colors.text, fontStyle: 'italic', lineHeight: 22 },
  actions: { marginTop: 20 },
});
