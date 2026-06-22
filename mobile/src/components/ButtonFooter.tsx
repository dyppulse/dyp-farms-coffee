import { StyleSheet, View, ViewProps } from 'react-native';
import { useScreenInsets } from '../hooks/useScreenInsets';

type ButtonFooterProps = ViewProps & {
  inTabs?: boolean;
};

export function ButtonFooter({ style, inTabs, ...props }: ButtonFooterProps) {
  const { contentBottom } = useScreenInsets({ inTabs });

  return (
    <View
      {...props}
      style={[styles.footer, { paddingBottom: contentBottom }, style]}
    />
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingTop: 16,
  },
});
