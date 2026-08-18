import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../src/components/Card';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { ScreenScrollView } from '../src/components/ScreenScrollView';
import { colors } from '../src/theme/colors';
import { fonts } from '../src/theme/typography';

const NOTIFICATIONS = [
  {
    icon: '⚡',
    title: 'New bid on Yirgacheffe lot',
    sub: 'Amina placed $8.75/kg — you are still leading',
    time: '2m ago',
    unread: true,
  },
  {
    icon: '🔬',
    title: 'AI grading complete',
    sub: 'Lot KE-2241 scored AA · 94/100',
    time: '1h ago',
    unread: true,
  },
  {
    icon: '💰',
    title: 'Payment received',
    sub: 'UGX 128,800 credited to your wallet',
    time: '3h ago',
    unread: false,
  },
  {
    icon: '🚚',
    title: 'Shipment update',
    sub: 'Lot #KE-2241 is now in transit',
    time: 'Yesterday',
    unread: false,
  },
  {
    icon: '☀️',
    title: 'Weather alert',
    sub: 'Light rains expected on the estate tomorrow',
    time: '2d ago',
    unread: false,
  },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Notifications" />
      <ScreenScrollView contentContainerStyle={styles.content}>
        {NOTIFICATIONS.map((n) => (
          <Card
            key={n.title}
            style={{
              ...styles.card,
              ...(n.unread ? styles.unread : {}),
            }}
          >
            <View style={styles.row}>
              <View style={styles.iconWell}>
                <Text style={styles.icon}>{n.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, n.unread && styles.titleUnread]}>
                  {n.title}
                </Text>
                <Text style={styles.sub}>{n.sub}</Text>
                <Text style={styles.time}>{n.time}</Text>
              </View>
              {n.unread ? <View style={styles.dot} /> : null}
            </View>
          </Card>
        ))}
      </ScreenScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.lavender },
  content: { padding: 16 },
  card: { marginBottom: 10 },
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
