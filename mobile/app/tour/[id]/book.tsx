import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, formatUGX, Tour, TourSlot } from '../../../src/api/client';
import { Button } from '../../../src/components/Button';
import { ScreenScrollView } from '../../../src/components/ScreenScrollView';
import { Card } from '../../../src/components/Card';
import { Input } from '../../../src/components/Input';
import { colors } from '../../../src/theme/colors';

function formatSlotLabel(slot: TourSlot): string {
  const date = new Date(slot.date).toLocaleDateString('en-UG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const spots = slot.capacity - slot.bookedGuests;
  return `${date} · ${slot.startTime} – ${slot.endTime} (${spots} spots left)`;
}

function param(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function TourBookScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = param(rawId);
  const [tour, setTour] = useState<Tour | null>(null);
  const [slots, setSlots] = useState<TourSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [guests, setGuests] = useState('2');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      Promise.all([api.tours.get(id), api.tours.slots(id)])
        .then(([t, s]) => {
          setTour(t);
          setSlots(s);
        })
        .finally(() => setLoading(false));
    }, [id]),
  );

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);
  const guestCount = Math.max(1, parseInt(guests, 10) || 1);

  const pricing = useMemo(() => {
    if (!tour) return null;
    const subtotal = tour.pricePerGuest * guestCount;
    return {
      subtotal,
      bookingFee: tour.bookingFee,
      total: subtotal + tour.bookingFee,
      currency: tour.currency,
    };
  }, [tour, guestCount]);

  function handleContinue() {
    if (!id || !tour) return;
    if (!selectedSlotId) {
      Alert.alert('Select a time slot', 'Choose a date and time before continuing to payment.');
      return;
    }
    router.push(
      `/tour/${id}/pay?slotId=${encodeURIComponent(selectedSlotId)}&guests=${guestCount}&total=${pricing?.total ?? 0}`,
    );
  }

  if (loading || !tour) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScreenScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{tour.title}</Text>
      <Text style={styles.subtitle}>Select a time slot</Text>

      {slots.length === 0 ? (
        <Text style={styles.empty}>No available slots in the next 14 days.</Text>
      ) : (
        slots.map((slot) => (
          <Pressable
            key={slot.id}
            onPress={() => setSelectedSlotId(slot.id)}
            style={[
              styles.slotItem,
              selectedSlotId === slot.id && styles.slotSelected,
            ]}
          >
            <Text
              style={[
                styles.slotText,
                selectedSlotId === slot.id && styles.slotTextSelected,
              ]}
            >
              {formatSlotLabel(slot)}
            </Text>
          </Pressable>
        ))
      )}

      <Input
        label="Number of guests"
        value={guests}
        onChangeText={setGuests}
        keyboardType="number-pad"
        placeholder="2"
      />

      {pricing && selectedSlot && (
        <Card style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {guestCount} guest(s) × {formatUGX(tour.pricePerGuest)}
            </Text>
            <Text style={styles.summaryValue}>{formatUGX(pricing.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Booking fee</Text>
            <Text style={styles.summaryValue}>{formatUGX(pricing.bookingFee)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatUGX(pricing.total)}</Text>
          </View>
        </Card>
      )}

      <Button
        title="Continue to payment"
        onPress={handleContinue}
        disabled={!selectedSlotId}
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
  empty: { color: colors.textSecondary, marginBottom: 16 },
  slotItem: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  slotSelected: { borderColor: colors.primary, backgroundColor: '#e8f5ee' },
  slotText: { fontSize: 14, color: colors.text },
  slotTextSelected: { color: colors.primary, fontWeight: '600' },
  summary: { marginVertical: 16 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: { color: colors.textSecondary, fontSize: 14 },
  summaryValue: { color: colors.text, fontSize: 14 },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 },
  totalLabel: { fontWeight: '700', color: colors.text },
  totalValue: { fontWeight: '700', color: colors.primary, fontSize: 16 },
});
