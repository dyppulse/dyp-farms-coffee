import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, formatUGX, Review, Tour } from '../../../src/api/client';
import { Button } from '../../../src/components/Button';
import { ScreenScrollView } from '../../../src/components/ScreenScrollView';
import { Card } from '../../../src/components/Card';
import { colors } from '../../../src/theme/colors';

export default function TourDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      Promise.all([api.tours.get(id), api.tours.reviews(id)])
        .then(([t, r]) => {
          setTour(t);
          setReviews(r);
        })
        .finally(() => setLoading(false));
    }, [id]),
  );

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
      <View style={styles.metaRow}>
        <Ionicons name="star" size={16} color={colors.accent} />
        <Text style={styles.meta}>
          {tour.rating} ({tour.reviewCount} reviews) · {tour.duration}
        </Text>
      </View>

      <Card style={styles.locationCard}>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={20} color={colors.primary} />
          <View style={styles.locationText}>
            <Text style={styles.locationName}>{tour.locationName}</Text>
            <Text style={styles.address}>
              {tour.address}, {tour.city}, {tour.country}
            </Text>
          </View>
        </View>
      </Card>

      <Text style={styles.description}>{tour.description}</Text>

      <Card style={styles.priceCard}>
        <Text style={styles.priceLabel}>From {formatUGX(tour.pricePerGuest)} per guest</Text>
        <Text style={styles.feeNote}>Booking fee: {formatUGX(tour.bookingFee)}</Text>
      </Card>

      {reviews.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {reviews.map((r) => (
            <Card key={r.id} style={styles.reviewCard}>
              <Text style={styles.reviewUser}>{r.userName}</Text>
              <Text style={styles.reviewComment}>{r.comment}</Text>
            </Card>
          ))}
        </>
      )}

      <Button
        title="Book this tour"
        onPress={() => router.push(`/tour/${id}/book`)}
        style={styles.bookBtn}
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  meta: { fontSize: 14, color: colors.textSecondary },
  locationCard: { marginBottom: 16 },
  locationRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  locationText: { flex: 1 },
  locationName: { fontSize: 15, fontWeight: '600', color: colors.text },
  address: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  description: { fontSize: 15, lineHeight: 22, color: colors.text, marginBottom: 16 },
  priceCard: { marginBottom: 20, backgroundColor: colors.primary },
  priceLabel: { color: colors.white, fontSize: 18, fontWeight: '600' },
  feeNote: { color: colors.accent, fontSize: 13, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
  reviewCard: { marginBottom: 8 },
  reviewUser: { fontWeight: '600', color: colors.text },
  reviewComment: { color: colors.textSecondary, marginTop: 4 },
  bookBtn: { marginTop: 8 },
});
