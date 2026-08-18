import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';

export default function SplashScreen() {
  useEffect(() => {
    const t = setTimeout(() => {
      router.replace('/(auth)/role-select');
    }, 2400);
    return () => clearTimeout(t);
  }, []);

  return (
    <LinearGradient
      colors={[colors.navy, colors.navy2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.logoWell}>
        <Text style={styles.bean}>☕</Text>
      </View>
      <Text style={styles.title}>Dyp Farms</Text>
      <Text style={styles.tagline}>Farm to Cup, Seamlessly Connected</Text>
      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logoWell: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bean: {
    fontSize: 44,
  },
  title: {
    fontFamily: fonts.displayBlack,
    fontSize: 36,
    color: colors.white,
  },
  tagline: {
    fontFamily: fonts.displayRegular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.5,
  },
  dots: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.white,
  },
});
