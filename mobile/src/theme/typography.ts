import { TextStyle } from 'react-native';
import { colors } from './colors';

export const fonts = {
  display: 'Poppins_700Bold',
  displaySemi: 'Poppins_600SemiBold',
  displayExtra: 'Poppins_800ExtraBold',
  displayBlack: 'Poppins_900Black',
  displayMedium: 'Poppins_500Medium',
  displayRegular: 'Poppins_400Regular',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
};

export const typography = {
  splashTitle: {
    fontFamily: fonts.displayBlack,
    fontSize: 36,
    color: colors.white,
    lineHeight: 40,
  } as TextStyle,
  pageTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: colors.navy,
    lineHeight: 34,
  } as TextStyle,
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.navy,
  } as TextStyle,
  eyebrow: {
    fontFamily: fonts.displaySemi,
    fontSize: 11,
    color: colors.navy2,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  } as TextStyle,
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  } as TextStyle,
  label: {
    fontFamily: fonts.displaySemi,
    fontSize: 12,
    color: colors.navy,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  } as TextStyle,
  button: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.white,
  } as TextStyle,
  tabLabel: {
    fontFamily: fonts.displayRegular,
    fontSize: 10,
  } as TextStyle,
};
