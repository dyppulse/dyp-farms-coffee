// Jest setup for React Native testing
import '@testing-library/jest-native/extend-expect';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    hostUri: 'localhost:8081',
  },
  expoGoConfig: {},
}));

// Mock React Native modules
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

// Mock expo-font
jest.mock('expo-font', () => ({
  loadAsync: jest.fn().mockResolvedValue(undefined),
  useFonts: jest.fn(() => [true]),
}));

// Suppress console warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Non-serializable values were found') ||
        args[0].includes('Animated: `useNativeDriver` was not specified'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
