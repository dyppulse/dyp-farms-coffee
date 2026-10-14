import { ScrollView, ScrollViewProps, StyleSheet } from 'react-native';
import { useScreenInsets } from '../hooks/useScreenInsets';

type ScreenScrollViewProps = ScrollViewProps & {
  /** Screens inside the tab navigator already sit above the tab bar. */
  inTabs?: boolean;
};

/** Used when a screen's own style sets no bottom padding at all. */
const DEFAULT_BOTTOM_PADDING = 16;

/**
 * A ScrollView whose content always clears the system navigation bar.
 *
 * The inset is *added to* whatever bottom padding the screen asks for, so a screen
 * style like `{ padding: 16 }` keeps its 16 and still gets the inset on top. (Putting
 * the inset first and the screen's style after it, as this used to, let `padding: 16`
 * silently replace the inset and left content hidden behind the bar.)
 */
export function ScreenScrollView({
  contentContainerStyle,
  inTabs,
  ...props
}: ScreenScrollViewProps) {
  const { bottom } = useScreenInsets({ inTabs });

  const own = StyleSheet.flatten(contentContainerStyle) ?? {};
  const base =
    typeof own.paddingBottom === 'number'
      ? own.paddingBottom
      : typeof own.padding === 'number'
        ? own.padding
        : DEFAULT_BOTTOM_PADDING;

  return (
    <ScrollView
      {...props}
      contentContainerStyle={[
        contentContainerStyle,
        { paddingBottom: base + (inTabs ? 0 : bottom) },
      ]}
    />
  );
}
