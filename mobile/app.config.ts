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
    backgroundColor: '#1B4332',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.dypfarms.coffee',
  },
  android: {
    package: 'com.dypfarms.coffee',
    adaptiveIcon: {
      backgroundColor: '#1B4332',
    },
  },
  plugins: ['expo-router', 'expo-secure-store'],
  extra: {
    apiUrl: process.env.API_URL ?? 'http://localhost:3001/api',
  },
});
