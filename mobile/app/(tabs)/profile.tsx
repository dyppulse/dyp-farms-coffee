import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { ScreenScrollView } from '../../src/components/ScreenScrollView';
import { useAuth } from '../../src/context/AuthContext';
import {
  BiometricCapability,
  getBiometricCapability,
} from '../../src/services/biometrics';
import { colors, roleAccent, roleLabel } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    user,
    logout,
    setPendingRole,
    biometricsEnabled,
    enableBiometrics,
    disableBiometrics,
  } = useAuth();
  const accent = roleAccent(user?.role);
  const [capability, setCapability] = useState<BiometricCapability | null>(null);
  const [bioModal, setBioModal] = useState(false);
  const [bioPassword, setBioPassword] = useState('');
  const [bioBusy, setBioBusy] = useState(false);

  useEffect(() => {
    getBiometricCapability().then(setCapability);
  }, []);

  async function handleSwitchRole() {
    await logout();
    await setPendingRole(null);
    router.replace('/(auth)/role-select');
  }

  async function handleLogout() {
    Alert.alert('Log out', 'Switch role or end this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Switch Role',
        onPress: handleSwitchRole,
      },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          await setPendingRole(null);
          router.replace('/(auth)/splash');
        },
      },
    ]);
  }

  async function handleBiometricsRow() {
    if (!capability?.available) {
      Alert.alert(
        'Unavailable',
        'Set up Face ID or a fingerprint in your device settings first.',
      );
      return;
    }

    if (biometricsEnabled) {
      Alert.alert(
        `Disable ${capability.primaryLabel}?`,
        'You will need your password to sign in next time.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await disableBiometrics();
              Alert.alert('Disabled', `${capability.primaryLabel} sign-in is off.`);
            },
          },
        ],
      );
      return;
    }

    setBioPassword('');
    setBioModal(true);
  }

  async function confirmEnableBiometrics() {
    if (!user?.email || !bioPassword.trim()) {
      Alert.alert('Password required', 'Enter your account password to enable biometrics.');
      return;
    }
    setBioBusy(true);
    try {
      const ok = await enableBiometrics(user.email, bioPassword.trim());
      if (ok) {
        setBioModal(false);
        Alert.alert(
          'Enabled',
          `${capability?.primaryLabel ?? 'Biometrics'} is ready for faster sign-in.`,
        );
      }
    } finally {
      setBioBusy(false);
    }
  }

  const sections = [
    {
      title: 'Account',
      items: ['Personal info', 'Farm / company details', 'Payment methods'],
    },
    {
      title: 'Preferences',
      items: ['Notifications', 'Language', 'Currency (UGX)'],
    },
    {
      title: 'Security',
      items: ['Change password', 'Biometrics'],
    },
    {
      title: 'Support',
      items: ['Help center', 'Contact support'],
    },
  ];

  return (
    <ScreenScrollView
      inTabs
      style={[styles.container, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Profile</Text>

      <Card style={styles.profileCard}>
        <View style={[styles.avatar, { borderColor: accent }]}>
          <Text style={styles.avatarEmoji}>
            {user?.role === 'farmer' ? '🌱' : user?.role === 'tourist' ? '🗺️' : '☕'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.badge, { backgroundColor: `${accent}18` }]}>
          <Text style={[styles.badgeText, { color: accent }]}>
            {roleLabel(user?.role)}
          </Text>
        </View>
      </Card>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Card style={styles.listCard}>
            {section.items.map((item, i) => (
              <Pressable
                key={item}
                style={[
                  styles.row,
                  i < section.items.length - 1 && styles.rowBorder,
                ]}
                onPress={() => {
                  if (item === 'Notifications') router.push('/notifications');
                  if (item === 'Biometrics') handleBiometricsRow();
                }}
              >
                <Text style={styles.rowLabel}>
                  {item === 'Biometrics'
                    ? `${capability?.primaryLabel ?? 'Biometrics'}${biometricsEnabled ? ' · On' : ''}`
                    : item}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            ))}
          </Card>
        </View>
      ))}

      <Button
        title="Switch Role / Log Out"
        variant="danger"
        onPress={handleLogout}
        style={{ marginTop: 8, marginBottom: 24 }}
      />

      <Modal visible={bioModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Enable {capability?.primaryLabel ?? 'Biometrics'}
            </Text>
            <Text style={styles.modalSub}>
              Confirm your password so we can securely unlock your account next time.
            </Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={bioPassword}
              onChangeText={setBioPassword}
              autoFocus
            />
            <Button
              title="Enable"
              onPress={confirmEnableBiometrics}
              loading={bioBusy}
            />
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setBioModal(false)}
              style={{ marginTop: 10 }}
              disabled={bioBusy}
            />
          </View>
        </View>
      </Modal>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lavender },
  content: { padding: 20 },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.navy,
    marginBottom: 16,
  },
  profileCard: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarEmoji: { fontSize: 36 },
  name: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    color: colors.navy,
  },
  email: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  badge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: fonts.displaySemi,
    fontSize: 12,
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontFamily: fonts.displaySemi,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  listCard: { paddingVertical: 4, paddingHorizontal: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lavender,
  },
  rowLabel: {
    fontFamily: fonts.displayMedium,
    fontSize: 15,
    color: colors.navy,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(14,21,102,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 18,
    color: colors.navy,
    marginBottom: 8,
  },
  modalSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: colors.lavender,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.navy,
    marginBottom: 16,
  },
});
