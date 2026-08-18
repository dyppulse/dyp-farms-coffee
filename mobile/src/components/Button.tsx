import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'green' | 'purple';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
}: ButtonProps) {
  const isDisabled = loading || disabled;
  const useGradient = variant === 'primary' || variant === 'green' || variant === 'purple';

  const gradientColors: [string, string] =
    variant === 'green'
      ? [colors.farmerGreen, colors.farmerGreenDark]
      : variant === 'purple'
        ? [colors.touristPurple, colors.navy2]
        : [colors.navy, colors.navy2];

  const content = loading ? (
    <ActivityIndicator
      color={variant === 'outline' ? colors.navy : colors.white}
    />
  ) : (
    <Text
      style={[
        styles.text,
        (variant === 'outline' || variant === 'secondary') && styles.outlineText,
        variant === 'danger' && styles.dangerText,
      ]}
    >
      {title}
    </Text>
  );

  if (useGradient) {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.base,
          isDisabled && styles.disabled,
          pressed && !isDisabled && styles.pressed,
          style,
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles.solid,
        variant === 'secondary' && styles.secondary,
        variant === 'outline' && styles.outline,
        variant === 'danger' && styles.danger,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  solid: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  secondary: {
    backgroundColor: colors.lavender,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.navy,
  },
  danger: {
    backgroundColor: `${colors.red}18`,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: colors.white,
    fontSize: 15,
    fontFamily: fonts.display,
  },
  outlineText: {
    color: colors.navy,
  },
  dangerText: {
    color: colors.red,
  },
});
