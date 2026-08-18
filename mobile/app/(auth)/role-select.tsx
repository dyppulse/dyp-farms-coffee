import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { colors, roleAccent, UserRole } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';

const roles: {
  role: UserRole;
  label: string;
  sub: string;
  emoji: string;
}[] = [
  {
    role: 'farmer',
    label: 'Farmer',
    sub: 'Manage harvests, auctions & financing',
    emoji: '🌱',
  },
  {
    role: 'roaster',
    label: 'Roaster / Buyer',
    sub: 'Source premium lots & manage orders',
    emoji: '☕',
  },
  {
    role: 'tourist',
    label: 'Tourist',
    sub: 'Explore coffee farms & book tours',
    emoji: '🗺️',
  },
];

export default function RoleSelectScreen() {
  const { setPendingRole } = useAuth();

  async function handleSelect(role: UserRole) {
    await setPendingRole(role);
    router.push('/(auth)/login');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>WELCOME TO DYP FARMS</Text>
        <Text style={styles.title}>Who are{'\n'}you?</Text>
        <Text style={styles.sub}>
          Select your role to get a personalized experience.
        </Text>

        <View style={styles.list}>
          {roles.map((r) => {
            const accent = roleAccent(r.role);
            return (
              <Pressable
                key={r.role}
                style={styles.card}
                onPress={() => handleSelect(r.role)}
              >
                <View style={[styles.iconWell, { backgroundColor: `${accent}18` }]}>
                  <Text style={styles.emoji}>{r.emoji}</Text>
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{r.label}</Text>
                  <Text style={styles.cardSub}>{r.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={accent} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  eyebrow: {
    fontFamily: fonts.displaySemi,
    fontSize: 11,
    color: colors.navy2,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 30,
    color: colors.navy,
    lineHeight: 36,
    marginBottom: 8,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  list: { gap: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    backgroundColor: colors.lavender,
    borderRadius: 20,
  },
  iconWell: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 28 },
  cardText: { flex: 1 },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.navy,
  },
  cardSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
