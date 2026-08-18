import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type BiometricKind = 'face' | 'fingerprint' | 'none';

export type BiometricCapability = {
  available: boolean;
  enrolled: boolean;
  hasFace: boolean;
  hasFingerprint: boolean;
  primaryLabel: string;
};

export async function getBiometricCapability(): Promise<BiometricCapability> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = hasHardware
    ? await LocalAuthentication.isEnrolledAsync()
    : false;
  const types = hasHardware
    ? await LocalAuthentication.supportedAuthenticationTypesAsync()
    : [];

  const hasFace = types.includes(
    LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
  );
  const hasFingerprint = types.includes(
    LocalAuthentication.AuthenticationType.FINGERPRINT,
  );

  let primaryLabel = 'Biometrics';
  if (hasFace && Platform.OS === 'ios') primaryLabel = 'Face ID';
  else if (hasFace) primaryLabel = 'Face Unlock';
  else if (hasFingerprint && Platform.OS === 'ios') primaryLabel = 'Touch ID';
  else if (hasFingerprint) primaryLabel = 'Fingerprint';

  return {
    available: hasHardware && enrolled,
    enrolled,
    hasFace,
    hasFingerprint,
    primaryLabel,
  };
}

export async function promptBiometric(
  kind: BiometricKind = 'none',
): Promise<{ success: boolean; error?: string }> {
  const capability = await getBiometricCapability();

  if (!capability.available) {
    if (!capability.enrolled) {
      return {
        success: false,
        error:
          'No biometrics enrolled. Add Face ID or a fingerprint in device settings.',
      };
    }
    return {
      success: false,
      error: 'Biometric authentication is not available on this device.',
    };
  }

  if (kind === 'face' && !capability.hasFace) {
    return {
      success: false,
      error:
        Platform.OS === 'ios'
          ? 'Face ID is not available on this device.'
          : 'Face unlock is not available on this device.',
    };
  }

  if (kind === 'fingerprint' && !capability.hasFingerprint) {
    return {
      success: false,
      error:
        Platform.OS === 'ios'
          ? 'Touch ID / fingerprint is not available on this device.'
          : 'Fingerprint is not available on this device.',
    };
  }

  const promptMessage =
    kind === 'face'
      ? Platform.OS === 'ios'
        ? 'Sign in with Face ID'
        : 'Sign in with Face Unlock'
      : kind === 'fingerprint'
        ? Platform.OS === 'ios'
          ? 'Sign in with Touch ID'
          : 'Sign in with Fingerprint'
        : `Sign in with ${capability.primaryLabel}`;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
    fallbackLabel: 'Use passcode',
  });

  if (result.success) {
    return { success: true };
  }

  if (result.error === 'user_cancel' || result.error === 'system_cancel') {
    return { success: false, error: 'cancelled' };
  }

  return {
    success: false,
    error: result.error ?? 'Biometric authentication failed',
  };
}
