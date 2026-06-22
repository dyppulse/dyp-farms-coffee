import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api, QualityCheck } from '../src/api/client';
import { Button } from '../src/components/Button';
import { ButtonFooter } from '../src/components/ButtonFooter';
import { Card } from '../src/components/Card';
import { colors } from '../src/theme/colors';

export default function QualityScreen() {
  const [result, setResult] = useState<QualityCheck | null>(null);
  const [scanning, setScanning] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleScan() {
    setScanning(true);
    setSaved(false);
    try {
      const check = await api.quality.scan();
      setResult(check);
    } finally {
      setScanning(false);
    }
  }

  function handleSave() {
    if (!result) return;
    setSaved(true);
    Alert.alert(
      'Saved',
      `${result.lotName} — ${result.grade} (${result.points} points) recorded.`,
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.scanCard}>
        {scanning ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : result ? (
          <View style={styles.result}>
            <Text style={styles.grade}>{result.grade}</Text>
            <Text style={styles.points}>{result.points}</Text>
            <Text style={styles.pointsLabel}>points</Text>
            <Text style={styles.lotName}>{result.lotName}</Text>
            {result.recommendations?.map((rec, i) => (
              <Text key={i} style={styles.rec}>✓ {rec}</Text>
            ))}
          </View>
        ) : (
          <Text style={styles.placeholder}>
            Tap Rescan to run AI quality analysis on a coffee lot
          </Text>
        )}
      </Card>
      </View>

      <ButtonFooter>
        {result && (
          <Button
            title={saved ? 'Saved' : 'Save'}
            onPress={handleSave}
            variant="outline"
            disabled={saved}
            style={{ marginBottom: 12 }}
          />
        )}
        <Button title="Rescan" onPress={handleScan} loading={scanning} />
      </ButtonFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  content: { flex: 1, justifyContent: 'center' },
  scanCard: {
    alignItems: 'center',
    paddingVertical: 48,
    minHeight: 300,
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  result: { alignItems: 'center' },
  grade: { fontSize: 28, fontWeight: '700', color: colors.primary },
  points: { fontSize: 72, fontWeight: '800', color: colors.text, marginTop: 8 },
  pointsLabel: { fontSize: 18, color: colors.textSecondary },
  lotName: { fontSize: 16, color: colors.secondary, marginTop: 16, fontWeight: '500' },
  rec: { fontSize: 14, color: colors.success, marginTop: 8 },
});
