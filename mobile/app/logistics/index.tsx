import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, Shipment } from '../../src/api/client';
import { Card } from '../../src/components/Card';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { StatusPill } from '../../src/components/StatusPill';
import { useScreenInsets } from '../../src/hooks/useScreenInsets';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';

function statusLabel(status: string): string {
  if (status === 'in_transit') return 'In Transit';
  if (status === 'delivered') return 'Delivered';
  return status.replace(/_/g, ' ');
}

function statusColor(status: string) {
  if (status === 'delivered') return colors.green;
  if (status === 'in_transit') return colors.navy2;
  return colors.amber;
}

export default function LogisticsListScreen() {
  const insets = useSafeAreaInsets();
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
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Shipments" />
      <FlatList
        data={shipments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: contentBottom }]}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/logistics/${item.id}`)}>
            <Card style={styles.card}>
              <View style={styles.row}>
                <Ionicons name="boat-outline" size={24} color={colors.navy2} />
                <View style={styles.info}>
                  <Text style={styles.lot}>Lot #{item.lotNumber}</Text>
                  <StatusPill
                    label={statusLabel(item.status)}
                    color={statusColor(item.status)}
                    style={{ marginTop: 6 }}
                  />
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lavender },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lavender,
  },
  list: { padding: 16 },
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1 },
  lot: {
    fontFamily: fonts.displaySemi,
    fontSize: 16,
    color: colors.navy,
  },
});
