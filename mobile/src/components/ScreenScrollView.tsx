import { ScrollView, ScrollViewProps } from 'react-native';
import { useScreenInsets } from '../hooks/useScreenInsets';

type ScreenScrollViewProps = ScrollViewProps & {
  inTabs?: boolean;
};

export function ScreenScrollView({
  contentContainerStyle,
  inTabs,
  ...props
}: ScreenScrollViewProps) {
  const { contentBottom } = useScreenInsets({ inTabs });

  return (
    <ScrollView
      {...props}
      contentContainerStyle={[
        { paddingBottom: contentBottom },
        contentContainerStyle,
      ]}
    />
  );
}
