import { ScrollView, ScrollViewProps, StyleSheet, View, ViewStyle } from 'react-native';
import { useScreenInsets } from '../hooks/useScreenInsets';

type ScreenScrollViewProps = ScrollViewProps & {
  /** Screens inside the tab navigator already sit above the tab bar. */
  inTabs?: boolean;
};

/** Used when a screen's own style sets no bottom padding at all. */
const DEFAULT_BOTTOM_PADDING = 16;

const PADDING_KEYS = [
  'padding',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingVertical',
  'paddingHorizontal',
] as const;

/**
 * Padding set on a ScrollView's own `style` (a status-bar inset, say) shrinks its
 * viewport, and on Android the scroll range comes out short, so the last content
 * can't be scrolled into view. Splits that padding off so it goes on a wrapping View.
 */
function splitOuterPadding(style: ScrollViewProps['style']) {
  const flat = (StyleSheet.flatten(style) ?? {}) as ViewStyle;
  const padding: ViewStyle = {};
  const rest: Record<string, unknown> = { ...flat };
  for (const key of PADDING_KEYS) {
    if (key in rest) {
      padding[key] = rest[key] as never;
      delete rest[key];
    }
  }
  return { padding, rest: rest as ViewStyle, hasPadding: Object.keys(padding).length > 0 };
}

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
  style,
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

  const contentStyle = [contentContainerStyle, { paddingBottom: base + (inTabs ? 0 : bottom) }];
  const { padding, rest, hasPadding } = splitOuterPadding(style);

  if (!hasPadding) {
    return <ScrollView {...props} style={style} contentContainerStyle={contentStyle} />;
  }

  return (
    <View style={[{ flex: rest.flex ?? 1, backgroundColor: rest.backgroundColor }, padding]}>
      <ScrollView {...props} style={[rest, { flex: 1 }]} contentContainerStyle={contentStyle} />
    </View>
  );
}
