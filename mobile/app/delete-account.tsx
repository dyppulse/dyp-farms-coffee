import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../src/api/client';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { Input } from '../src/components/Input';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { ScreenScrollView } from '../src/components/ScreenScrollView';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme/colors';
import { fonts } from '../src/theme/typography';

export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, setPendingRole, disableBiometrics } = useAuth();
  const [password, setPassword] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!password.trim()) {
      Alert.alert('Password required', 'Enter your password to confirm.');
      return;
    }
    setBusy(true);
    try {
      await api.account.delete(password);
      await disableBiometrics();
      await logout();
      await setPendingRole(null);
      Alert.alert('Account deleted', 'Your account and personal data have been removed.');
      router.replace('/(auth)/splash');
    } catch (e) {
      Alert.alert('Could not delete account', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScreenHeader title="Delete account" />
      <ScreenScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text accessibilityRole="header" style={styles.heading}>
            Delete {user?.email ?? 'your account'}?
          </Text>
          <Text style={styles.body}>This permanently removes:</Text>
          <Text style={styles.item}>• Your profile and sign-in details</Text>
          <Text style={styles.item}>• Your farms and boundaries</Text>
          <Text style={styles.item}>• Your notifications and support tickets</Text>
          <Text style={[styles.body, styles.gap]}>
            Payment and booking records are kept without your personal details, because the
            law requires us to keep financial records. This cannot be undone.
          </Text>
        </Card>

        {confirming ? (
          <>
            <Input
              label="Confirm with your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="••••••••"
            />
            <Button
              title="Permanently delete my account"
              variant="danger"
              onPress={handleDelete}
              loading={busy}
              testID="confirm-delete-account"
            />
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => {
                setConfirming(false);
                setPassword('');
              }}
              disabled={busy}
            />
          </>
        ) : (
          <Button
            title="Delete my account"
            variant="danger"
            onPress={() => setConfirming(true)}
            testID="start-delete-account"
          />
        )}
      </ScreenScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 14 },
  card: { gap: 6 },
  heading: { fontFamily: fonts.displaySemi, fontSize: 17, color: colors.error },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.textBody },
  item: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.textBody },
  gap: { marginTop: 8 },
});
