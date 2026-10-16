import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { ScreenScrollView } from '../../src/components/ScreenScrollView';
import { LEGAL_DOCS, LEGAL_UPDATED } from '../../src/legal/content';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';

export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const content = doc === 'terms' ? LEGAL_DOCS.terms : LEGAL_DOCS.privacy;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScreenHeader title={content.title} />
      <ScreenScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Last updated {LEGAL_UPDATED}</Text>
        <Text style={styles.body}>{content.intro}</Text>
        {content.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text accessibilityRole="header" style={styles.heading}>
              {section.heading}
            </Text>
            {section.body.map((paragraph) => (
              <Text key={paragraph} style={styles.body}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
      </ScreenScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  updated: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  section: { gap: 8, marginTop: 8 },
  heading: { fontFamily: fonts.displaySemi, fontSize: 16, color: colors.navy },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.textBody },
});
