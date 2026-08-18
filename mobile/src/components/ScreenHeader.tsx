import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  light?: boolean;
  right?: ReactNode;
  style?: ViewStyle;
};

export function ScreenHeader({
  title,
  onBack,
  light,
  right,
  style,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <Pressable
        onPress={onBack ?? (() => router.back())}
        style={[styles.backBtn, light && styles.backBtnLight]}
        hitSlop={8}
      >
        <Ionicons
          name="chevron-back"
          size={22}
          color={light ? colors.white : colors.navy}
        />
      </Pressable>
      <Text style={[styles.title, light && styles.titleLight]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnLight: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.displayExtra,
    color: colors.navy,
  },
  titleLight: {
    color: colors.white,
  },
  right: {
    minWidth: 38,
    alignItems: 'flex-end',
  },
});
