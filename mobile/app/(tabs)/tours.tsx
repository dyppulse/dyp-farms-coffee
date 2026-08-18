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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, formatUGX, Review, Tour } from '../../src/api/client';
import { Card } from '../../src/components/Card';
import { ScreenScrollView } from '../../src/components/ScreenScrollView';
import { StatusPill } from '../../src/components/StatusPill';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';

export default function ToursScreen() {
  const insets = useSafeAreaInsets();
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
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <ScreenScrollView
      inTabs
      style={[styles.container, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.list}
    >
      <Text style={styles.title}>Experiences</Text>
      <Text style={styles.sub}>Book farm tours, stays, and tastings</Text>

      <LinearGradient
        colors={[colors.navy, colors.navy2]}
        style={styles.promo}
      >
        <Text style={styles.promoTitle}>Meet the Farmer</Text>
        <Text style={styles.promoDesc}>
          Walk the estate, join a harvest, and taste coffee from seed to cup.
        </Text>
      </LinearGradient>

      {tours.map((item) => (
        <Pressable key={item.id} onPress={() => router.push(`/tour/${item.id}`)}>
          <Card style={styles.tourCard}>
            <View style={styles.hero}>
              <Text style={{ fontSize: 40 }}>🏞️</Text>
              <StatusPill
                label={item.type}
                color={colors.navy2}
                style={styles.typeBadge}
              />
            </View>
            <Text style={styles.tourTitle}>{item.title}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.location}>{item.locationName}</Text>
            </View>
            <Text style={styles.tourMeta}>
              ★ {item.rating} · {item.duration} · {formatUGX(item.pricePerGuest)}
            </Text>
            <Text style={styles.tourDesc} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.bookCta}>
              <Text style={styles.bookCtaText}>Book This Experience →</Text>
            </View>
          </Card>
        </Pressable>
      ))}

      <Card style={styles.reviewsCard}>
        <Text style={styles.reviewsTitle}>Ratings & Reviews ({reviews.length})</Text>
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
  container: { flex: 1, backgroundColor: colors.lavender },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lavender,
  },
  list: { padding: 20 },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.navy,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  promo: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  promoTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.white,
  },
  promoDesc: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 8,
    lineHeight: 20,
  },
  tourCard: { marginBottom: 14 },
  hero: {
    height: 100,
    borderRadius: 14,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  typeBadge: { position: 'absolute', top: 10, left: 10 },
  tourTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.navy,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  location: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  tourMeta: {
    fontFamily: fonts.displayMedium,
    fontSize: 13,
    color: colors.navy2,
    marginTop: 6,
  },
  tourDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  bookCta: {
    marginTop: 14,
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bookCtaText: {
    fontFamily: fonts.displaySemi,
    fontSize: 13,
    color: colors.white,
  },
  reviewsCard: { marginTop: 8 },
  reviewsTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.navy,
    marginBottom: 12,
  },
  review: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lavender,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewName: {
    fontFamily: fonts.displaySemi,
    color: colors.navy,
  },
  reviewRating: { color: colors.amber },
  reviewComment: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
