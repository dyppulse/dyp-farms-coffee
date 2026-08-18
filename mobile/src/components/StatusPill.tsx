import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { fonts } from '../theme/typography';

export function StatusPill({
  label,
  color,
  style,
}: {
  label: string;
  color: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: `${color}18` }, style]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
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
