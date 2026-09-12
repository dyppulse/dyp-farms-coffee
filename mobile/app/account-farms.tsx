import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Farm, apiExtended } from '../src/api/client';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { ScreenScrollView } from '../src/components/ScreenScrollView';
import { colors } from '../src/theme/colors';
import { fonts } from '../src/theme/typography';

export default function AccountFarmsScreen() {
  const insets = useSafeAreaInsets();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setFarms(await apiExtended.farms.list());
    } catch {
      // keep empty list on failure
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function confirmDelete(farm: Farm) {
    Alert.alert('Remove farm', `Remove "${farm.name}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await apiExtended.farms.remove(farm.id).catch(() => {});
          load();
        },
      },
    ]);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Your Farms" />
      <ScreenScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Register every plot you farm — GPS location and boundary — so you can pick the right
          one when logging a harvest, and buyers can trace it back to source.
        </Text>

        <Button title="+ Add Farm" onPress={() => router.push('/farm-new')} />

        {loading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: 24 }} />
        ) : farms.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No farms registered yet.</Text>
          </Card>
        ) : (
          farms.map((farm) => (
            <Card key={farm.id} style={styles.farmCard}>
              <View style={styles.farmRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.farmName}>{farm.name}</Text>
                  <Text style={styles.farmMeta}>
                    {farm.boundary.length === 1
                      ? 'Single pin'
                      : `${farm.boundary.length}-point boundary`}
                    {farm.sizeHectares ? ` · ~${farm.sizeHectares} ha` : ''}
                  </Text>
                </View>
                <Pressable onPress={() => confirmDelete(farm)} hitSlop={8}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </ScreenScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.lavender },
  content: { padding: 16, gap: 12 },
  intro: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  emptyCard: { alignItems: 'center', paddingVertical: 28 },
  emptyText: { fontFamily: fonts.body, color: colors.textMuted },
  farmCard: {},
  farmRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  farmName: { fontFamily: fonts.displayMedium, fontSize: 15, color: colors.navy },
  farmMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  removeText: { fontFamily: fonts.displayMedium, fontSize: 13, color: colors.error },
});
