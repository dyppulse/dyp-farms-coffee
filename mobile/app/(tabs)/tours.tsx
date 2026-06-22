import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api, formatUGX, Review, Tour } from '../../src/api/client';
import { Card } from '../../src/components/Card';
import { ScreenScrollView } from '../../src/components/ScreenScrollView';
import { colors } from '../../src/theme/colors';

const typeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  tour: 'walk-outline',
  accommodation: 'bed-outline',
  tasting: 'wine-outline',
};

const tourSections: { key: string; title: string; types: string[] }[] = [
  { key: 'tours', title: 'Book Tours', types: ['tour'] },
  { key: 'accommodation', title: 'Farm Accommodations', types: ['accommodation'] },
  { key: 'tasting', title: 'Tastings', types: ['tasting'] },
];

function TourCard({ item }: { item: Tour }) {
  return (
    <Pressable onPress={() => router.push(`/tour/${item.id}`)}>
      <Card style={styles.tourCard}>
        <View style={styles.tourHeader}>
          <Ionicons
            name={typeIcons[item.type] ?? 'leaf-outline'}
            size={28}
            color={colors.primary}
          />
          <View style={styles.tourInfo}>
            <Text style={styles.tourTitle}>{item.title}</Text>
            <Text style={styles.tourMeta}>
              {item.duration} · {formatUGX(item.pricePerGuest)} · ★ {item.rating} (
              {item.reviewCount})
            </Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.location}>{item.locationName}</Text>
        </View>
        <Text style={styles.tourDesc} numberOfLines={2}>
          {item.description}
        </Text>
      </Card>
    </Pressable>
  );
}

export default function ToursScreen() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [toursData, reviewsData] = await Promise.all([
        api.tours.list(),
        api.tours.reviews(),
      ]);
      setTours(toursData);
      setReviews(reviewsData);
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
    <ScreenScrollView inTabs style={styles.container} contentContainerStyle={styles.list}>
      <Text style={styles.title}>Dyp Farms Coffee Tours</Text>
      <Card style={styles.farmerCard}>
        <Text style={styles.farmerTitle}>Meet the Farmer</Text>
        <Text style={styles.farmerDesc}>
          Take a tour of our estate, meet the farmers behind your favorite lots,
          and experience coffee from seed to cup.
        </Text>
      </Card>
      {tourSections.map((section) => {
        const sectionTours = tours.filter((t) => section.types.includes(t.type));
        if (sectionTours.length === 0) return null;
        return (
          <View key={section.key}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {sectionTours.map((item) => (
              <TourCard key={item.id} item={item} />
            ))}
          </View>
        );
      })}
      <Card style={styles.reviewsCard}>
        <Text style={styles.reviewsTitle}>
          Ratings & Reviews ({reviews.length})
        </Text>
        {reviews.map((review) => (
          <View key={review.id} style={styles.review}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewName}>{review.userName}</Text>
              <Text style={styles.reviewRating}>{'★'.repeat(review.rating)}</Text>
            </View>
            <Text style={styles.reviewComment}>{review.comment}</Text>
          </View>
        ))}
      </Card>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 16 },
  farmerCard: { marginBottom: 16, backgroundColor: colors.primary },
  farmerTitle: { fontSize: 18, fontWeight: '600', color: colors.white },
  farmerDesc: { fontSize: 14, color: colors.accent, marginTop: 8, lineHeight: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    marginTop: 4,
  },
  tourCard: { marginBottom: 12 },
  tourHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  tourInfo: { flex: 1 },
  tourTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  tourMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  location: { fontSize: 12, color: colors.textSecondary, flex: 1 },
  tourDesc: { fontSize: 14, color: colors.textSecondary, marginTop: 8, lineHeight: 20 },
  reviewsCard: { marginTop: 8 },
  reviewsTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
  review: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewName: { fontWeight: '600', color: colors.text },
  reviewRating: { color: colors.accent },
  reviewComment: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
});
