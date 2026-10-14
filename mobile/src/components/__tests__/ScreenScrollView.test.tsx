import { render } from '@testing-library/react-native';
import { ScrollView, StyleSheet } from 'react-native';
import { ScreenScrollView } from '../ScreenScrollView';

// A phone with a 34dp system navigation bar.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

const bottomPadding = (ui: React.ReactElement) => {
  const { UNSAFE_getByType } = render(ui);
  const style = StyleSheet.flatten(UNSAFE_getByType(ScrollView).props.contentContainerStyle);
  return style.paddingBottom;
};

describe('ScreenScrollView', () => {
  it('adds the nav-bar inset on top of the screen padding instead of replacing it', () => {
    // This is the bug: `padding: 16` used to overwrite the inset, leaving just 16.
    expect(bottomPadding(<ScreenScrollView contentContainerStyle={{ padding: 16 }} />)).toBe(16 + 34);
  });

  it('prefers an explicit paddingBottom over padding', () => {
    expect(
      bottomPadding(<ScreenScrollView contentContainerStyle={{ padding: 20, paddingBottom: 8 }} />),
    ).toBe(8 + 34);
  });

  it('falls back to a 16 gutter when the screen sets no padding', () => {
    expect(bottomPadding(<ScreenScrollView />)).toBe(16 + 34);
  });

  it('does not add the inset inside tabs, where the tab bar already clears it', () => {
    expect(bottomPadding(<ScreenScrollView inTabs contentContainerStyle={{ padding: 20 }} />)).toBe(20);
  });
});
