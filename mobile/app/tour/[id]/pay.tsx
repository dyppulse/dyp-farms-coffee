import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../../../src/api/client';
import { Button } from '../../../src/components/Button';
import { ScreenScrollView } from '../../../src/components/ScreenScrollView';
import { Card } from '../../../src/components/Card';
import { Input } from '../../../src/components/Input';
import { colors } from '../../../src/theme/colors';

type PaymentMethod = 'mtn_momo' | 'airtel_money';

function param(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const METHODS: { id: PaymentMethod; label: string; color: string }[] = [
  { id: 'mtn_momo', label: 'MTN Mobile Money', color: '#FFCC00' },
  { id: 'airtel_money', label: 'Airtel Money', color: '#ED1C24' },
];

export default function TourPayScreen() {
  const params = useLocalSearchParams<{
    id: string;
    slotId: string;
    guests: string;
    total: string;
  }>();
  const id = param(params.id);
  const slotId = param(params.slotId);
  const guests = param(params.guests);
  const [method, setMethod] = useState<PaymentMethod>('mtn_momo');
  const [phone, setPhone] = useState('+256');
  const [loading, setLoading] = useState(false);
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([
    'mtn_momo',
    'airtel_money',
  ]);

  useEffect(() => {
    api.wallet.paymentMethods().then((r) => {
      if (r.methods.length > 0) setAvailableMethods(r.methods);
    }).catch(() => {});
  }, []);

  async function handlePay() {
    if (!id || !slotId || phone.length < 10) {
      Alert.alert('Error', 'Enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      const result = await api.bookings.create(id, {
        slotId,
        guests: parseInt(guests || '1', 10),
        paymentMethod: method,
        phoneNumber: phone,
      });
      router.replace(`/booking/${result.bookingId}`);
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
  note: { marginVertical: 16, backgroundColor: '#f0f7f4' },
  noteText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
});
