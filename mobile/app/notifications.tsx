import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppNotification, apiExtended } from '../src/api/client';
import { Card } from '../src/components/Card';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { ScreenScrollView } from '../src/components/ScreenScrollView';
import { colors } from '../src/theme/colors';
import { fonts } from '../src/theme/typography';

const ICONS: Record<AppNotification['type'], string> = {
  bid: '⚡',
  grading: '🔬',
  payment: '💰',
  shipment: '🚚',
  weather: '☀️',
  general: '🔔',
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiExtended.notifications.list();
      setNotifications(data);
    } catch {
      // leave list empty — screen still renders with an empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handlePress = async (n: AppNotification) => {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      apiExtended.notifications.markRead(n.id).catch(() => {});
    }

    if (n.entityType === 'auction' && n.entityId) {
      router.push(`/auction/${n.entityId}` as never);
    } else if (n.entityType === 'lot' && n.entityId) {
      router.push(`/lot/${n.entityId}` as never);
    } else if (n.entityType === 'farm' && n.entityId) {
      router.push('/account-farms' as never);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Notifications" />
      <ScreenScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} />
        ) : notifications.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>You're all caught up — no notifications yet.</Text>
          </Card>
        ) : (
          notifications.map((n) => (
            <Pressable key={n.id} onPress={() => handlePress(n)}>
              <Card
                style={{
                  ...styles.card,
                  ...(!n.read ? styles.unread : {}),
                }}
              >
                <View style={styles.row}>
                  <View style={styles.iconWell}>
                    <Text style={styles.icon}>{ICONS[n.type] ?? '🔔'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, !n.read && styles.titleUnread]}>{n.title}</Text>
                    <Text style={styles.sub}>{n.body}</Text>
                    <Text style={styles.time}>{timeAgo(n.createdAt)}</Text>
                  </View>
                  {!n.read ? <View style={styles.dot} /> : null}
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScreenScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.lavender },
  content: { padding: 16 },
  card: { marginBottom: 10 },
  emptyCard: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontFamily: fonts.body, color: colors.textMuted },
  unread: {
    borderLeftWidth: 4,
    borderLeftColor: colors.navy2,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconWell: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  title: {
    fontFamily: fonts.displayMedium,
    fontSize: 14,
    color: colors.navy,
  },
  titleUnread: {
    fontFamily: fonts.display,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  time: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
    marginTop: 6,
  },
});
