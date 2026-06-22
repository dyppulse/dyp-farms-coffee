import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GUTTER = 16;

type ScreenInsetsOptions = {
  /** Screens inside the tab navigator already sit above the tab bar. */
  inTabs?: boolean;
};

export function useScreenInsets(options?: ScreenInsetsOptions) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);
  const contentBottom = options?.inTabs ? GUTTER : bottomInset + GUTTER;

  return {
    top: insets.top,
    right: insets.right,
    bottom: bottomInset,
    left: insets.left,
    contentBottom,
    screen: {
      paddingTop: insets.top,
      paddingBottom: bottomInset + GUTTER,
      paddingLeft: Math.max(insets.left, GUTTER),
      paddingRight: Math.max(insets.right, GUTTER),
    },
  };
}
