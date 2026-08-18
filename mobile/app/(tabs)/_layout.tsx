import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { colors, UserRole } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';

const TAB_BAR_HEIGHT = 56;

type TabDef = {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const TABS: TabDef[] = [
  { name: 'index', title: 'Home', icon: 'home-outline' },
  { name: 'harvest', title: 'Harvest', icon: 'leaf-outline' },
  { name: 'marketplace', title: 'Market', icon: 'bag-outline' },
  { name: 'orders', title: 'Orders', icon: 'checkbox-outline' },
  { name: 'tours', title: 'Tours', icon: 'map-outline' },
  { name: 'track', title: 'Track', icon: 'navigate-outline' },
  { name: 'wallet', title: 'Wallet', icon: 'wallet-outline' },
  { name: 'profile', title: 'Profile', icon: 'person-outline' },
];

const PRIMARY_TABS: Record<UserRole, string[]> = {
  farmer: ['index', 'harvest', 'wallet', 'track', 'profile'],
  roaster: ['index', 'marketplace', 'orders', 'wallet', 'profile'],
  tourist: ['index', 'tours', 'marketplace', 'wallet', 'profile'],
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);
  const { user } = useAuth();
  const role = (user?.role ?? 'roaster') as UserRole;
  const titleForHome = role === 'tourist' ? 'Explore' : 'Home';
  const visible = new Set(PRIMARY_TABS[role]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.navy2,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: fonts.displayRegular,
          fontSize: 10,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.lavender,
          paddingTop: 8,
          paddingBottom: bottomInset,
          height: TAB_BAR_HEIGHT + bottomInset,
        },
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.white,
        headerTitleStyle: { fontFamily: fonts.displaySemi },
        headerShown: false,
      }}
    >
      {TABS.map((tab) => {
        const show = visible.has(tab.name);
        return (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.name === 'index' ? titleForHome : tab.title,
              href: show ? undefined : null,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name={tab.icon} size={size} color={color} />
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}
