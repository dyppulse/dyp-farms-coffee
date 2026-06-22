import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { colors } from '../src/theme/colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.white,
            headerTitleStyle: { fontWeight: '600' },
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/signup" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="tour/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="booking/[id]" options={{ title: 'Your Booking' }} />
          <Stack.Screen name="lot/[id]" options={{ title: 'Lot Details' }} />
          <Stack.Screen name="auction/[lotId]" options={{ title: 'Live Auction' }} />
          <Stack.Screen name="cart" options={{ title: 'Your Cart' }} />
          <Stack.Screen name="logistics/index" options={{ title: 'Shipments' }} />
          <Stack.Screen name="logistics/[id]" options={{ title: 'Shipment Tracking' }} />
          <Stack.Screen name="quality" options={{ title: 'AI Quality Check' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
