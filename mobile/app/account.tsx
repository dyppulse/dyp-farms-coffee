import { View, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../src/components/Card';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { ScreenScrollView } from '../src/components/ScreenScrollView';
import { useAuth } from '../src/context/AuthContext';
import { colors, roleAccent, roleLabel } from '../src/theme/colors';
import { fonts } from '../src/theme/typography';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const accent = roleAccent(user?.role);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Personal Info" />
      <ScreenScrollView contentContainerStyle={styles.content}>
        <Card style={styles.profileCard}>
          <View style={[styles.avatar, { borderColor: accent }]}>
            <Text style={styles.avatarEmoji}>
              {user?.role === 'farmer' ? '🌱' : user?.role === 'tourist' ? '🗺️' : '☕'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <View style={[styles.badge, { backgroundColor: `${accent}18` }]}>
            <Text style={[styles.badgeText, { color: accent }]}>{roleLabel(user?.role)}</Text>
          </View>
        </Card>

        <Card style={styles.listCard}>
          <Row label="Full name" value={user?.name ?? '—'} />
          <Row label="Email" value={user?.email ?? '—'} />
          <Row label="Account type" value={roleLabel(user?.role)} />
          <Row label="Account ID" value={user?.id ?? '—'} />
        </Card>

        <Text style={styles.hint}>
          Need to update your name or email? Reach out via Contact Support and our team will
          help you make the change.
        </Text>
      </ScreenScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.lavender },
  content: { padding: 20, gap: 16 },
  profileCard: { alignItems: 'center' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarEmoji: { fontSize: 32 },
  name: { fontFamily: fonts.displayExtra, fontSize: 18, color: colors.navy },
  badge: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontFamily: fonts.displaySemi, fontSize: 12 },
  listCard: { paddingVertical: 4, paddingHorizontal: 0 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.lavender,
  },
  rowLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  rowValue: { fontFamily: fonts.displayMedium, fontSize: 13, color: colors.navy },
  hint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
});
