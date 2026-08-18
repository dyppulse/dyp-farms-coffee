import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Dyp Farms Coffee',
  slug: 'dyp-farms-coffee',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'dypfarms',
  userInterfaceStyle: 'light',
  splash: {
    backgroundColor: '#14532D',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.dypfarms.coffee',
    infoPlist: {
      NSFaceIDUsageDescription:
        'Dyp Farms uses Face ID to sign you in securely without typing your password.',
      NSCameraUsageDescription:
        'Dyp Farms uses the camera to photograph harvested coffee beans for AI quality grading.',
      NSPhotoLibraryUsageDescription:
        'Dyp Farms accesses your photos so you can analyze coffee bean images.',
    },
  },
  android: {
    package: 'com.dypfarms.coffee',
    adaptiveIcon: {
      backgroundColor: '#14532D',
    },
    permissions: [
      'USE_BIOMETRIC',
      'USE_FINGERPRINT',
      'CAMERA',
      'READ_MEDIA_IMAGES',
    ],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-local-authentication',
      {
        faceIDPermission:
          'Allow Dyp Farms to use Face ID for secure sign-in.',
      },
    ],
    [
      'expo-image-picker',
      {
        cameraPermission:
          'Allow Dyp Farms to use your camera to grade coffee beans.',
        photosPermission:
          'Allow Dyp Farms to access photos of coffee beans for AI grading.',
      },
    ],
  ],
  extra: {
    apiUrl: process.env.API_URL ?? 'http://localhost:3001/api',
  },
});
