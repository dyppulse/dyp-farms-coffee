import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { api, setAuthToken } from '../api/client';
import {
  getBiometricCapability,
  promptBiometric,
  BiometricKind,
} from '../services/biometrics';
import { UserRole } from '../theme/colors';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  pendingRole: UserRole | null;
  biometricsEnabled: boolean;
  setPendingRole: (role: UserRole | null) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    name: string,
    role?: UserRole,
  ) => Promise<void>;
  loginWithBiometrics: (kind?: BiometricKind) => Promise<void>;
  enableBiometrics: (email: string, password: string) => Promise<boolean>;
  disableBiometrics: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'dyp_auth_token';
const USER_KEY = 'dyp_user';
const PENDING_ROLE_KEY = 'dyp_pending_role';
const BIO_ENABLED_KEY = 'dyp_bio_enabled';
const BIO_CREDS_KEY = 'dyp_bio_creds';

function normalizeRole(role: string | undefined): UserRole {
  if (role === 'farmer' || role === 'roaster' || role === 'tourist') return role;
  if (role === 'buyer') return 'roaster';
  return 'roaster';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRole, setPendingRoleState] = useState<UserRole | null>(null);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const [token, storedUser, storedRole, bioFlag] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
        SecureStore.getItemAsync(PENDING_ROLE_KEY),
        SecureStore.getItemAsync(BIO_ENABLED_KEY),
      ]);
      if (storedRole) {
        setPendingRoleState(normalizeRole(storedRole));
      }
      setBiometricsEnabled(bioFlag === '1');
      if (token && storedUser) {
        const parsed = JSON.parse(storedUser) as User;
        const normalized = { ...parsed, role: normalizeRole(parsed.role) };
        setAuthToken(token);
        setUser(normalized);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function setPendingRole(role: UserRole | null) {
    setPendingRoleState(role);
    if (role) {
      await SecureStore.setItemAsync(PENDING_ROLE_KEY, role);
    } else {
      await SecureStore.deleteItemAsync(PENDING_ROLE_KEY);
    }
  }

  async function enableBiometrics(email: string, password: string) {
    const capability = await getBiometricCapability();
    if (!capability.available) {
      Alert.alert(
        'Biometrics unavailable',
        'Set up Face ID or a fingerprint in your device settings first.',
      );
      return false;
    }

    try {
      await api.auth.login(email, password);
    } catch {
      Alert.alert('Incorrect password', 'Check your password and try again.');
      return false;
    }

    const prompt = await promptBiometric(
      capability.hasFace ? 'face' : capability.hasFingerprint ? 'fingerprint' : 'none',
    );
    if (!prompt.success) {
      if (prompt.error !== 'cancelled') {
        Alert.alert('Could not enable', prompt.error ?? 'Authentication failed');
      }
      return false;
    }

    await SecureStore.setItemAsync(
      BIO_CREDS_KEY,
      JSON.stringify({ email, password }),
    );
    await SecureStore.setItemAsync(BIO_ENABLED_KEY, '1');
    setBiometricsEnabled(true);
    return true;
  }

  async function disableBiometrics() {
    await SecureStore.deleteItemAsync(BIO_CREDS_KEY);
    await SecureStore.deleteItemAsync(BIO_ENABLED_KEY);
    setBiometricsEnabled(false);
  }

  async function maybeOfferBiometrics(email: string, password: string) {
    if (biometricsEnabled) {
      // Keep stored creds in sync after password login
      await SecureStore.setItemAsync(
        BIO_CREDS_KEY,
        JSON.stringify({ email, password }),
      );
      return;
    }

    const capability = await getBiometricCapability();
    if (!capability.available) return;

    Alert.alert(
      `Enable ${capability.primaryLabel}?`,
      `Use ${capability.primaryLabel} next time for faster sign-in.`,
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Enable',
          onPress: async () => {
            const ok = await enableBiometrics(email, password);
            if (ok) {
              Alert.alert(
                'Enabled',
                `${capability.primaryLabel} is ready for the next sign-in.`,
              );
            }
          },
        },
      ],
    );
  }

  async function login(email: string, password: string) {
    const result = await api.auth.login(email, password);
    await persistAuth(result.accessToken, {
      ...result.user,
      role: normalizeRole(result.user.role),
    });
    await maybeOfferBiometrics(email, password);
  }

  async function signup(
    email: string,
    password: string,
    name: string,
    role?: UserRole,
  ) {
    const selectedRole = role ?? pendingRole ?? 'roaster';
    const result = await api.auth.signup({
      email,
      password,
      name,
      role: selectedRole,
    });
    await persistAuth(result.accessToken, {
      ...result.user,
      role: normalizeRole(result.user.role),
    });
    await maybeOfferBiometrics(email, password);
  }

  async function loginWithBiometrics(kind: BiometricKind = 'none') {
    const enabled = await SecureStore.getItemAsync(BIO_ENABLED_KEY);
    const raw = await SecureStore.getItemAsync(BIO_CREDS_KEY);
    if (enabled !== '1' || !raw) {
      throw new Error(
        'Biometrics not set up yet. Sign in with email and password first, then enable Face ID or Fingerprint.',
      );
    }

    const prompt = await promptBiometric(kind);
    if (!prompt.success) {
      if (prompt.error === 'cancelled') {
        throw new Error('cancelled');
      }
      throw new Error(prompt.error ?? 'Biometric authentication failed');
    }

    const creds = JSON.parse(raw) as { email: string; password: string };
    const result = await api.auth.login(creds.email, creds.password);
    await persistAuth(result.accessToken, {
      ...result.user,
      role: normalizeRole(result.user.role),
    });
  }

  async function persistAuth(token: string, userData: User) {
    setAuthToken(token);
    setUser(userData);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
    await SecureStore.deleteItemAsync(PENDING_ROLE_KEY);
    setPendingRoleState(null);
  }

  async function logout() {
    setAuthToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        pendingRole,
        biometricsEnabled,
        setPendingRole,
        login,
        signup,
        loginWithBiometrics,
        enableBiometrics,
        disableBiometrics,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
