import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
  useFonts,
} from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { colors } from '../src/theme/colors';
import { fonts } from '../src/theme/typography';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.lavender }}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.navy },
            headerTintColor: colors.white,
            headerTitleStyle: { fontFamily: fonts.displaySemi },
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/splash" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/role-select" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="tour/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="booking/[id]" options={{ title: 'Your Booking' }} />
          <Stack.Screen name="lot/[id]" options={{ title: 'Lot Details' }} />
          <Stack.Screen name="auction/[lotId]" options={{ headerShown: false }} />
          <Stack.Screen name="cart" options={{ title: 'Your Cart' }} />
          <Stack.Screen name="logistics/index" options={{ headerShown: false }} />
          <Stack.Screen name="logistics/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="quality" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="ai-assistant" options={{ title: 'AI Assistant', presentation: 'modal' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
