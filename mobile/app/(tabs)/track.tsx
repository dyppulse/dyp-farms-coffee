import { Ionicons } from '@expo/vector-icons';
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
import { api, Shipment } from '../../src/api/client';
import { Card } from '../../src/components/Card';
import { ScreenScrollView } from '../../src/components/ScreenScrollView';
import { StatusPill } from '../../src/components/StatusPill';
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

export default function TrackScreen() {
  const insets = useSafeAreaInsets();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.logistics.list();
      setShipments(data);
    } catch {
      setShipments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScreenScrollView
      inTabs
      style={[styles.container, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Track Shipments</Text>
      <Text style={styles.sub}>Follow your lots from farm to buyer</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.navy} style={{ marginTop: 40 }} />
      ) : shipments.length === 0 ? (
        <Card>
          <Text style={styles.empty}>No shipments yet</Text>
        </Card>
      ) : (
        shipments.map((s) => (
          <Pressable key={s.id} onPress={() => router.push(`/logistics/${s.id}`)}>
            <Card style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.id}>Lot #{s.lotNumber}</Text>
                <StatusPill label={statusLabel(s.status)} color={statusColor(s.status)} />
              </View>
              <Text style={styles.meta}>
                {s.events?.[0]?.location ?? 'Farm'} → latest: {statusLabel(s.status)}
              </Text>
              <View style={styles.footer}>
                <Ionicons name="cube-outline" size={16} color={colors.navy2} />
                <Text style={styles.link}>View timeline</Text>
              </View>
            </Card>
          </Pressable>
        ))
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
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  card: { marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  id: {
    fontFamily: fonts.displaySemi,
    fontSize: 15,
    color: colors.navy,
    flex: 1,
    marginRight: 8,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  link: {
    fontFamily: fonts.displaySemi,
    fontSize: 13,
    color: colors.navy2,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
