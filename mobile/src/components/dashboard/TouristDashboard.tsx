import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatUGX, Tour } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { Card } from '../Card';

const STORIES = [
  { name: 'Sarah K.', text: 'Amazing harvest experience at Limuru!', likes: 24 },
  { name: 'Marco R.', text: 'The cupping session changed how I taste coffee.', likes: 18 },
];

export function TouristDashboard({ tours }: { tours: Tour[] }) {
  const { user } = useAuth();

  return (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.name}>Coffee Tours 🗺️</Text>
        <View style={styles.nearPill}>
          <Text style={styles.nearText}>📍 Near Me</Text>
        </View>
      </View>

      <View style={styles.mapCard}>
        <LinearGradient
          colors={['#A8C5A0', '#3D6B4F']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.mapOverlay}>
          <View style={styles.mapSearch}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <Text style={styles.mapSearchText}>Search farms near you…</Text>
          </View>
          <View style={styles.pins}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.pin,
                  i === 0 ? styles.pinActive : styles.pinIdle,
                  { left: 40 + i * 70, top: 50 + (i % 2) * 40 },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nearby Tours</Text>
        <Pressable onPress={() => router.push('/(tabs)/tours')}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {tours.slice(0, 5).map((t) => (
          <Pressable key={t.id} onPress={() => router.push(`/tour/${t.id}`)}>
            <Card style={styles.tourCardH}>
              <Text style={styles.tourEmoji}>🏞️</Text>
              <Text style={styles.tourTitle} numberOfLines={2}>
                {t.title}
              </Text>
              <Text style={styles.tourMeta}>
                ★ {t.rating} · {formatUGX(t.pricePerGuest)}
              </Text>
              <Pressable
                style={styles.bookMini}
                onPress={() => router.push(`/tour/${t.id}`)}
              >
                <Text style={styles.bookMiniText}>Book Now</Text>
              </Pressable>
            </Card>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Community Stories</Text>
      {STORIES.map((s) => (
        <Card key={s.name} style={styles.storyCard}>
          <Text style={styles.storyName}>{s.name}</Text>
          <Text style={styles.storyText}>{s.text}</Text>
          <Text style={styles.storyLikes}>♥ {s.likes}</Text>
        </Card>
      ))}

      <Text style={{ opacity: 0, height: 0 }}>{user?.name}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  name: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.navy,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.navy,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {
    fontFamily: fonts.displaySemi,
    fontSize: 13,
    color: colors.navy2,
  },
  nearPill: {
    backgroundColor: colors.navy,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  nearText: {
    fontFamily: fonts.displaySemi,
    fontSize: 12,
    color: colors.white,
  },
  mapCard: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  mapOverlay: { flex: 1, padding: 16 },
  mapSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  mapSearchText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  pins: { flex: 1 },
  pin: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  pinActive: { backgroundColor: colors.red },
  pinIdle: { backgroundColor: colors.white, borderWidth: 3, borderColor: colors.navy2 },
  tourCardH: {
    width: 180,
    marginRight: 12,
  },
  tourEmoji: { fontSize: 28, marginBottom: 8 },
  tourTitle: {
    fontFamily: fonts.displaySemi,
    fontSize: 14,
    color: colors.navy,
    minHeight: 40,
  },
  tourMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginVertical: 8,
  },
  bookMini: {
    backgroundColor: colors.navy,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  bookMiniText: {
    fontFamily: fonts.displaySemi,
    fontSize: 12,
    color: colors.white,
  },
  storyCard: { marginBottom: 10 },
  storyName: {
    fontFamily: fonts.displaySemi,
    fontSize: 14,
    color: colors.navy,
  },
  storyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textBody,
    marginTop: 4,
  },
  storyLikes: {
    fontFamily: fonts.displayMedium,
    fontSize: 12,
    color: colors.red,
    marginTop: 8,
  },
});
