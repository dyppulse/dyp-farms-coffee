import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, QualityCheck } from '../../src/api/client';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { ScreenScrollView } from '../../src/components/ScreenScrollView';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';

type Step = 'form' | 'scanning' | 'result';

type PickedImage = {
  uri: string;
  mimeType?: string;
  fileName?: string;
};

export default function HarvestScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('form');
  const [variety, setVariety] = useState('Arabica AA');
  const [qty, setQty] = useState('480');
  const [moisture, setMoisture] = useState('11.5');
  const [gps, setGps] = useState('-1.2921, 36.8219');
  const [image, setImage] = useState<PickedImage | null>(null);
  const [result, setResult] = useState<QualityCheck | null>(null);

  useFocusEffect(
    useCallback(() => {
      // keep form state when returning; only reset scan step if needed
    }, []),
  );

  async function pickImage(fromCamera: boolean) {
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Camera permission', 'Enable camera access to photograph beans.');
        return;
      }
      const picked = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      setImage({
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        fileName: asset.fileName ?? 'harvest.jpg',
      });
      return;
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos permission', 'Enable photo access to select bean images.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    setImage({
      uri: asset.uri,
      mimeType: asset.mimeType ?? 'image/jpeg',
      fileName: asset.fileName ?? 'harvest.jpg',
    });
  }

  function promptPickImage() {
    Alert.alert('Bean photo', 'Add a photo of harvested coffee beans', [
      { text: 'Camera', onPress: () => pickImage(true) },
      { text: 'Library', onPress: () => pickImage(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function runScan() {
    if (!image) {
      Alert.alert('Photo required', 'Add a bean photo before running AI grading.');
      return;
    }
    setStep('scanning');
    try {
      const data = await api.quality.scan({
        imageUri: image.uri,
        mimeType: image.mimeType,
        fileName: image.fileName,
        variety,
        moistureNote: moisture ? `${moisture}%` : undefined,
      });
      setResult(data);
      setStep('result');
    } catch (e) {
      Alert.alert('Scan failed', (e as Error).message);
      setStep('form');
    }
  }

  return (
    <ScreenScrollView
      inTabs
      style={[styles.container, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Harvest + AI Grading</Text>
      <Text style={styles.sub}>
        Photograph beans and run free-tier Gemini analysis
      </Text>

      {step === 'form' ? (
        <Card>
          <Text style={styles.label}>Coffee Variety</Text>
          <TextInput style={styles.input} value={variety} onChangeText={setVariety} />
          <Text style={styles.label}>Quantity (kg)</Text>
          <TextInput
            style={styles.input}
            value={qty}
            onChangeText={setQty}
            keyboardType="decimal-pad"
          />
          <Text style={styles.label}>Moisture (%)</Text>
          <TextInput
            style={styles.input}
            value={moisture}
            onChangeText={setMoisture}
            keyboardType="decimal-pad"
          />
          <Text style={styles.label}>GPS Location</Text>
          <TextInput style={styles.input} value={gps} onChangeText={setGps} />

          <Pressable style={styles.upload} onPress={promptPickImage}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.uploadPreview} />
            ) : (
              <Text style={styles.uploadText}>📷 Tap to add bean photos</Text>
            )}
            {image ? (
              <Text style={styles.uploadHint}>Tap to change photo</Text>
            ) : null}
          </Pressable>

          <Button title="Run AI Quality Check" variant="purple" onPress={runScan} />
        </Card>
      ) : null}

      {step === 'scanning' ? (
        <Card style={styles.centerCard}>
          <ActivityIndicator size="large" color={colors.touristPurple} />
          <Text style={styles.scanText}>Analyzing beans…</Text>
        </Card>
      ) : null}

      {step === 'result' && result ? (
        <Card>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.resultPreview} />
          ) : null}
          <LinearGradient
            colors={[colors.farmerGreen, colors.farmerGreenDark]}
            style={styles.gradeCard}
          >
            <Text style={styles.gradeLabel}>AI Grade</Text>
            <Text style={styles.gradeValue}>
              {result.grade} · {result.points}/100
            </Text>
          </LinearGradient>
          {result.summary ? (
            <Text style={styles.summary}>{result.summary}</Text>
          ) : null}
          <View style={styles.metrics}>
            {[
              { k: 'Moisture', v: result.moistureEstimate ?? `${moisture}%` },
              { k: 'Defect', v: result.defectRate ?? '—' },
              { k: 'Screen', v: result.screenSize ?? '—' },
              { k: 'Colour', v: result.colourScore ?? '—' },
            ].map((m) => (
              <View key={m.k} style={styles.metric}>
                <Text style={styles.metricK}>{m.k}</Text>
                <Text style={styles.metricV}>{m.v}</Text>
              </View>
            ))}
          </View>
          {result.recommendations?.map((rec, i) => (
            <Text key={i} style={styles.rec}>
              ✓ {rec}
            </Text>
          ))}
          <Button
            title="Generate Warehouse Receipt"
            variant="green"
            onPress={() =>
              Alert.alert('Receipt', 'Warehouse receipt generated (demo)')
            }
            style={{ marginTop: 12 }}
          />
          <Button
            title="Scan Another Lot"
            variant="outline"
            onPress={() => {
              setStep('form');
              setResult(null);
              setImage(null);
            }}
            style={{ marginTop: 10 }}
          />
          <Button
            title="Open Full Scanner"
            variant="secondary"
            onPress={() => router.push('/quality')}
            style={{ marginTop: 10 }}
          />
        </Card>
      ) : null}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lavender },
  content: { padding: 20 },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.navy,
    marginBottom: 4,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  label: {
    fontFamily: fonts.displaySemi,
    fontSize: 12,
    color: colors.navy,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.lavender,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.navy,
    marginBottom: 4,
  },
  upload: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.navy2,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: `${colors.navy2}08`,
    overflow: 'hidden',
  },
  uploadPreview: {
    width: '100%',
    height: 160,
    borderRadius: 10,
  },
  uploadText: {
    fontFamily: fonts.displayMedium,
    fontSize: 13,
    color: colors.navy2,
    paddingVertical: 16,
  },
  uploadHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  centerCard: { alignItems: 'center', paddingVertical: 48 },
  scanText: {
    fontFamily: fonts.displaySemi,
    fontSize: 16,
    color: colors.navy,
    marginTop: 16,
  },
  resultPreview: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 12,
  },
  gradeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  gradeLabel: {
    fontFamily: fonts.displayMedium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  gradeValue: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: colors.white,
    marginTop: 4,
  },
  summary: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textBody,
    marginBottom: 12,
    lineHeight: 20,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  metric: {
    width: '47%',
    backgroundColor: colors.lavender,
    borderRadius: 12,
    padding: 12,
  },
  metricK: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  metricV: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.navy,
    marginTop: 2,
  },
  rec: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
});
