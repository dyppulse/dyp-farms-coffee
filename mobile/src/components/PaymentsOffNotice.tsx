import { StyleSheet, Text, View } from 'react-native';
import { PAYMENTS_OFF_MESSAGE } from '../hooks/usePaymentsAvailable';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

export function PaymentsOffNotice() {
  return (
    <View accessibilityRole="alert" style={styles.box}>
      <Text style={styles.text}>{PAYMENTS_OFF_MESSAGE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: `${colors.amber}18`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  text: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.amber },
});
