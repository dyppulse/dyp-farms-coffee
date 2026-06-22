import { Stack } from 'expo-router';
import { colors } from '../../../src/theme/colors';

export default function TourLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Tour Details' }} />
      <Stack.Screen name="book" options={{ title: 'Book Tour' }} />
      <Stack.Screen name="pay" options={{ title: 'Payment' }} />
    </Stack>
  );
}
