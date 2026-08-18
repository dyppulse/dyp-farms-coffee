import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, Shipment } from '../../src/api/client';
import { Card } from '../../src/components/Card';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { ScreenScrollView } from '../../src/components/ScreenScrollView';
import { StatusPill } from '../../src/components/StatusPill';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';

export default function LogisticsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  async function handleVerify() {
    if (!shipment) return;
    setVerifying(true);
    try {
      const result = await api.logistics.verifyQr(shipment.qrCode);
      Alert.alert(
        result.verified ? 'Verified' : 'Not found',
        result.verified
          ? `Shipment for Lot #${result.shipment.lotNumber} is authentic.`
          : 'QR code could not be verified.',
      );
    } catch (e) {
      Alert.alert('Verification failed', (e as Error).message);
    } finally {
      setVerifying(false);
    }
  }

  useEffect(() => {
    if (id) {
      api.logistics
        .get(id)
        .then(setShipment)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading || !shipment) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  const statusColor =
    shipment.status === 'delivered'
      ? colors.green
      : shipment.status === 'in_transit'
        ? colors.navy2
        : colors.amber;

  const statusLabel =
    shipment.status === 'in_transit'
      ? 'In Transit'
      : shipment.status.replace(/_/g, ' ');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Shipment Tracking" />
      <ScreenScrollView contentContainerStyle={styles.content}>
        <Card style={styles.header}>
          <Text style={styles.lotLabel}>SHP-{shipment.lotNumber}</Text>
          <StatusPill label={statusLabel} color={statusColor} style={{ marginTop: 8 }} />
          <Text style={styles.route}>Farm → Processing → Shipping → Buyer</Text>
        </Card>

        <Pressable onPress={handleVerify} disabled={verifying} style={styles.qrCard}>
          <Ionicons name="qr-code" size={64} color={colors.navy} />
          <Text style={styles.qrTitle}>Scan QR Code for Verification</Text>
          <Text style={styles.qrCode}>{shipment.qrCode}</Text>
          <Text style={styles.verifyHint}>
            {verifying ? 'Verifying…' : 'Tap to verify this shipment'}
          </Text>
        </Pressable>

        <Text style={styles.timelineTitle}>Tracking Timeline</Text>
        {shipment.events.map((event, index) => {
          const done = index < shipment.events.length - 1 || shipment.status === 'delivered';
          const active = index === shipment.events.length - 1;
          return (
            <View key={event.id} style={styles.eventRow}>
              <View style={styles.timeline}>
                <View
                  style={[
                    styles.dot,
                    done && styles.doneDot,
                    active && styles.activeDot,
                  ]}
                />
                {index < shipment.events.length - 1 ? (
                  <View style={styles.line} />
                ) : null}
              </View>
              <View style={styles.eventContent}>
                <Text style={styles.eventStatus}>{event.status}</Text>
                <Text style={styles.eventLocation}>{event.location}</Text>
                <Text style={styles.eventTime}>
                  {new Date(event.timestamp).toLocaleString()}
                </Text>
              </View>
            </View>
          );
        })}
      </ScreenScrollView>
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
  content: { padding: 16 },
  header: { marginBottom: 16 },
  lotLabel: {
    fontFamily: fonts.displayExtra,
    fontSize: 18,
    color: colors.navy,
  },
  route: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12,
  },
  qrCard: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 24,
    backgroundColor: colors.white,
    borderRadius: 20,
  },
  verifyHint: {
    fontFamily: fonts.displayMedium,
    fontSize: 12,
    color: colors.navy2,
    marginTop: 12,
  },
  qrTitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  qrCode: {
    fontFamily: fonts.displaySemi,
    fontSize: 16,
    color: colors.navy,
    marginTop: 8,
  },
  timelineTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.navy,
    marginBottom: 16,
  },
  eventRow: { flexDirection: 'row', marginBottom: 4 },
  timeline: { width: 24, alignItems: 'center' },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.lavender,
    borderWidth: 2,
    borderColor: colors.textMuted,
  },
  doneDot: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  activeDot: {
    backgroundColor: colors.green,
    borderColor: colors.green,
    shadowColor: colors.green,
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.lavender,
    marginVertical: 2,
  },
  eventContent: { flex: 1, paddingLeft: 12, paddingBottom: 20 },
  eventStatus: {
    fontFamily: fonts.displayMedium,
    fontSize: 15,
    color: colors.navy,
  },
  eventLocation: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  eventTime: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
});
