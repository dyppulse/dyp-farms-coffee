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
      NSLocationWhenInUseUsageDescription:
        'Dyp Farms uses your location to register your farm boundaries for traceability.',
    },
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
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
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
    ],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
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
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Allow Dyp Farms to use your location to register your farm boundaries.',
      },
    ],
  ],
  extra: {
    apiUrl: process.env.API_URL ?? 'http://localhost:3001/api',
    eas: {
      projectId: '34d42cc1-4f5c-4f7a-8457-82ccb9ea56ef',
    },
  },
  owner: 'dyppulse',
});
