import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const STATUS_COLORS: Record<string, string> = {
  verified: colors.success,
  approved: colors.success,
  funded: colors.success,
  active: colors.success,
  pending: colors.warning,
  paused: colors.warning,
  rejected: colors.error,
  cancelled: colors.error,
};

type Props = { style?: ViewStyle } & (
  | { label: string; color: string; status?: never }
  | { status: string; label?: string; color?: string }
);

export function StatusPill({ label, color, status, style }: Props) {
  const text = label ?? (status ? status.charAt(0).toUpperCase() + status.slice(1) : '');
  const tint = color ?? (status ? STATUS_COLORS[status] : undefined) ?? colors.textSecondary;
  return (
    <View
      accessible
      accessibilityLabel={`Status: ${text}`}
      style={[styles.pill, { backgroundColor: `${tint}18` }, style]}
    >
      <Text style={[styles.text, { color: tint }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontFamily: fonts.displaySemi,
  },
});
