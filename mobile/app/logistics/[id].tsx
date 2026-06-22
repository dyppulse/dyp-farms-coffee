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
import { Ionicons } from '@expo/vector-icons';
import { api, Shipment } from '../../src/api/client';
import { Card } from '../../src/components/Card';
import { colors } from '../../src/theme/colors';

export default function LogisticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
      api.logistics.get(id).then(setShipment).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading || !shipment) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const statusColor =
    shipment.status === 'delivered'
      ? colors.success
      : shipment.status === 'in_transit'
        ? colors.warning
        : colors.textSecondary;

  return (
    <View style={styles.container}>
      <Card style={styles.header}>
        <Text style={styles.lotLabel}>Lot #{shipment.lotNumber}</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Shipment Status:</Text>
          <Text style={[styles.status, { color: statusColor }]}>
            {shipment.status === 'in_transit' ? 'In Transit' : shipment.status}
          </Text>
        </View>
      </Card>

      <Pressable onPress={handleVerify} disabled={verifying} style={styles.qrCard}>
        <Ionicons name="qr-code" size={64} color={colors.primary} />
        <Text style={styles.qrTitle}>Scan QR Code for Verification</Text>
        <Text style={styles.qrCode}>{shipment.qrCode}</Text>
        <Text style={styles.verifyHint}>
          {verifying ? 'Verifying…' : 'Tap to verify this shipment'}
        </Text>
      </Pressable>

      <Text style={styles.timelineTitle}>Tracking Timeline</Text>
      {shipment.events.map((event, index) => (
        <View key={event.id} style={styles.eventRow}>
          <View style={styles.timeline}>
            <View
              style={[
                styles.dot,
                index === shipment.events.length - 1 && styles.activeDot,
              ]}
            />
            {index < shipment.events.length - 1 && <View style={styles.line} />}
          </View>
          <View style={styles.eventContent}>
            <Text style={styles.eventStatus}>{event.status}</Text>
            <Text style={styles.eventLocation}>{event.location}</Text>
            <Text style={styles.eventTime}>
              {new Date(event.timestamp).toLocaleString()}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 16 },
  lotLabel: { fontSize: 18, fontWeight: '600', color: colors.text },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  statusLabel: { fontSize: 14, color: colors.textSecondary },
  status: { fontSize: 14, fontWeight: '600' },
  qrCard: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  verifyHint: { fontSize: 12, color: colors.primary, marginTop: 12, fontWeight: '500' },
  qrTitle: { fontSize: 14, color: colors.textSecondary, marginTop: 12 },
  qrCode: { fontSize: 16, fontWeight: '600', color: colors.primary, marginTop: 8 },
  timelineTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 },
  eventRow: { flexDirection: 'row', marginBottom: 4 },
  timeline: { width: 24, alignItems: 'center' },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  activeDot: { backgroundColor: colors.primary },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2 },
  eventContent: { flex: 1, paddingLeft: 12, paddingBottom: 20 },
  eventStatus: { fontSize: 15, fontWeight: '500', color: colors.text },
  eventLocation: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  eventTime: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});
