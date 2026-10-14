import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

interface HeaderGreetingProps {
  name: string;
  emoji: string;
  subtitle?: string;
  unreadCount?: number;
}

export function HeaderGreeting({
  name,
  emoji,
  subtitle,
  unreadCount = 0,
}: HeaderGreetingProps) {
  return (
    <View style={styles.headerRow}>
      <View style={{ flex: 1 }}>
        {subtitle ? <Text style={styles.goodMorning}>{subtitle}</Text> : null}
        <Text style={styles.name}>
          {name} {emoji}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Pressable
          style={styles.bell}
          onPress={() => router.push('/ai-assistant')}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.navy} />
        </Pressable>
        <Pressable
          style={styles.bell}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.navy} />
          {unreadCount > 0 ? <View style={styles.bellDot} /> : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  goodMorning: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  name: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.navy,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
});
