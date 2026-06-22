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
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api, Shipment } from '../../src/api/client';
import { Card } from '../../src/components/Card';
import { useScreenInsets } from '../../src/hooks/useScreenInsets';
import { colors } from '../../src/theme/colors';

function statusLabel(status: string): string {
  if (status === 'in_transit') return 'In Transit';
  if (status === 'delivered') return 'Delivered';
  return status;
}

export default function LogisticsListScreen() {
  const { contentBottom } = useScreenInsets();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.logistics.list();
      setShipments(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={shipments}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.list, { paddingBottom: contentBottom }]}
      ListHeaderComponent={
        <Text style={styles.title}>Track Logistics</Text>
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/logistics/${item.id}`)}>
          <Card style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="boat-outline" size={24} color={colors.primary} />
              <View style={styles.info}>
                <Text style={styles.lot}>Lot #{item.lotNumber}</Text>
                <Text style={styles.status}>{statusLabel(item.status)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </Card>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 16 },
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1 },
  lot: { fontSize: 16, fontWeight: '600', color: colors.text },
  status: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
