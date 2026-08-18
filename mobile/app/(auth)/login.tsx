import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { useAuth } from '../../src/context/AuthContext';
import {
  BiometricCapability,
  getBiometricCapability,
} from '../../src/services/biometrics';
import { colors, roleLabel, UserRole } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';

const demoEmails: Record<UserRole, string> = {
  farmer: 'farmer@dypfarms.com',
  roaster: 'buyer@dypfarms.com',
  tourist: 'tourist@dypfarms.com',
};

export default function LoginScreen() {
  const { login, signup, pendingRole, loginWithBiometrics, biometricsEnabled } =
    useAuth();
  const role = (pendingRole ?? 'roaster') as UserRole;
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(demoEmails[role]);
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [capability, setCapability] = useState<BiometricCapability | null>(null);

  useEffect(() => {
    setEmail(demoEmails[role]);
  }, [role]);

  useEffect(() => {
    getBiometricCapability().then(setCapability);
  }, []);

  const portalLabel = useMemo(
    () => `${roleLabel(role).toUpperCase()} PORTAL`,
    [role],
  );

  async function handleSubmit() {
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          Alert.alert('Missing name', 'Please enter your full name');
          return;
        }
        await signup(email.trim(), password, name.trim(), role);
      } else {
        await login(email.trim(), password);
      }
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert(
        mode === 'signup' ? 'Sign Up Failed' : 'Login Failed',
        (e as Error).message,
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleBiometric(kind: 'face' | 'fingerprint') {
    if (mode !== 'login') {
      Alert.alert(
        'Sign in first',
        'Create an account with email and password, then you can enable biometrics.',
      );
      return;
    }

    setBioLoading(true);
    try {
      await loginWithBiometrics(kind);
      router.replace('/(tabs)');
    } catch (e) {
      const message = (e as Error).message;
      if (message === 'cancelled') return;
      Alert.alert('Biometric sign-in failed', message);
    } finally {
      setBioLoading(false);
    }
  }

  const faceLabel = Platform.OS === 'ios' ? 'Face ID' : 'Face Unlock';
  const fingerLabel = Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
  const faceEnabled = !!capability?.hasFace;
  const fingerEnabled = !!capability?.hasFingerprint;
  const bioReady = biometricsEnabled && !!capability?.available;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.navy, colors.navy2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Roles</Text>
          </Pressable>
          <Text style={styles.portal}>{portalLabel}</Text>
          <Text style={styles.welcome}>
            {mode === 'login' ? 'Welcome back' : 'Welcome to'}
          </Text>
          <Text style={styles.brand}>Dyp Farms</Text>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.formWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          <SegmentedControl
            options={[
              { key: 'login', label: 'Log In' },
              { key: 'signup', label: 'Sign Up' },
            ]}
            value={mode}
            onChange={(k) => setMode(k as 'login' | 'signup')}
          />

          {mode === 'signup' ? (
            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="John Kamau"
              autoCapitalize="words"
            />
          ) : null}

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />

          <Button
            title={mode === 'login' ? 'Log In' : 'Create Account'}
            onPress={handleSubmit}
            loading={loading}
            disabled={bioLoading}
          />

          {mode === 'login' ? (
            <>
              <Text style={styles.or}>or continue with</Text>
              {!bioReady ? (
                <Text style={styles.bioHint}>
                  Sign in once with email, then enable {capability?.primaryLabel ?? 'biometrics'} when prompted.
                </Text>
              ) : null}
              <View style={styles.bioRow}>
                <Pressable
                  style={[
                    styles.bioBtn,
                    (!faceEnabled || bioLoading) && styles.bioBtnDisabled,
                    bioReady && faceEnabled && styles.bioBtnReady,
                  ]}
                  disabled={!faceEnabled || bioLoading}
                  onPress={() => handleBiometric('face')}
                >
                  <Text style={styles.bioIcon}>🔒</Text>
                  <Text style={styles.bioLabel}>{faceLabel}</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.bioBtn,
                    (!fingerEnabled || bioLoading) && styles.bioBtnDisabled,
                    bioReady && fingerEnabled && styles.bioBtnReady,
                  ]}
                  disabled={!fingerEnabled || bioLoading}
                  onPress={() => handleBiometric('fingerprint')}
                >
                  <Text style={styles.bioIcon}>👆</Text>
                  <Text style={styles.bioLabel}>{fingerLabel}</Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  back: { marginTop: 8, marginBottom: 16 },
  backText: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: fonts.displayMedium,
    fontSize: 14,
  },
  portal: {
    fontFamily: fonts.displaySemi,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  welcome: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: colors.white,
  },
  brand: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: colors.white,
  },
  formWrap: { flex: 1 },
  form: {
    padding: 24,
    gap: 4,
  },
  or: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  bioHint: {
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  bioRow: { flexDirection: 'row', gap: 12 },
  bioBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.lavender,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
  },
  bioBtnReady: {
    borderColor: colors.navy2,
    backgroundColor: colors.lavender,
  },
  bioBtnDisabled: {
    opacity: 0.4,
  },
  bioIcon: { fontSize: 20 },
  bioLabel: {
    fontFamily: fonts.displayMedium,
    fontSize: 13,
    color: colors.navy,
  },
});
