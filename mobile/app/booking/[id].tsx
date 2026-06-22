import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { api, Booking, formatUGX, TicketPayload } from '../../src/api/client';
import { Button } from '../../src/components/Button';
import { ScreenScrollView } from '../../src/components/ScreenScrollView';
import { useScreenInsets } from '../../src/hooks/useScreenInsets';
import { Card } from '../../src/components/Card';
import { colors } from '../../src/theme/colors';

export default function BookingConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { contentBottom } = useScreenInsets();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [ticket, setTicket] = useState<TicketPayload | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;

    async function poll() {
      try {
        const b = await api.bookings.poll(id);
        setBooking(b);
        if (b.status === 'confirmed' && b.ticketCode) {
          const t = await api.bookings.ticket(id);
          setTicket(t);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (b.status === 'cancelled' || b.status === 'expired') {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // keep polling
      }
    }

    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  if (!booking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.waiting}>Processing payment…</Text>
        <Text style={styles.hint}>Check your phone to approve the payment.</Text>
      </View>
    );
  }

  if (booking.status === 'pending_payment') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.waiting}>Waiting for payment approval</Text>
        <Text style={styles.hint}>
          Total: {formatUGX(booking.totalAmount)}
        </Text>
        <Text style={styles.hint}>Check your phone to approve the payment.</Text>
      </View>
    );
  }

  if (booking.status !== 'confirmed') {
    return (
      <View style={[styles.centered, { paddingBottom: contentBottom }]}>
        <Text style={styles.errorTitle}>Booking {booking.status}</Text>
        <Text style={styles.hint}>Payment was not completed. Please try again.</Text>
        <Button title="Back to tours" onPress={() => router.replace('/(tabs)/tours')} />
      </View>
    );
  }

  return (
    <ScreenScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.confirmed}>Booking confirmed!</Text>

      <Card style={styles.ticketCard}>
        <Text style={styles.ticketLabel}>Virtual ticket</Text>
        <Text style={styles.ticketCode}>{ticket?.ticketCode || booking.ticketCode}</Text>

        {ticket && (
          <>
            <Text style={styles.tourName}>{ticket.booking.tour}</Text>
            <Text style={styles.detail}>{ticket.booking.location}</Text>
            <Text style={styles.detail}>
              {new Date(ticket.booking.date).toLocaleDateString('en-UG', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.detail}>
              {ticket.booking.startTime} – {ticket.booking.endTime}
            </Text>
            <Text style={styles.detail}>{ticket.booking.guests} guest(s)</Text>
            <Text style={styles.paid}>
              Paid: {formatUGX(ticket.booking.totalAmount)}
            </Text>
          </>
        )}
      </Card>

      <Text style={styles.emailNote}>
        A confirmation email with your ticket has been sent to your registered email.
      </Text>

      <Button title="Done" onPress={() => router.replace('/(tabs)/tours')} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  waiting: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 16 },
  hint: { fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
  errorTitle: { fontSize: 20, fontWeight: '700', color: colors.error },
  confirmed: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 16 },
  ticketCard: { backgroundColor: colors.primary, marginBottom: 16 },
  ticketLabel: { color: colors.accent, fontSize: 12, textTransform: 'uppercase' },
  ticketCode: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
    marginVertical: 12,
  },
  tourName: { color: colors.white, fontSize: 18, fontWeight: '600' },
  detail: { color: colors.accent, fontSize: 14, marginTop: 4 },
  paid: { color: colors.white, fontSize: 16, fontWeight: '600', marginTop: 12 },
  emailNote: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
});
