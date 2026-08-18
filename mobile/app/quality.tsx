import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, QualityCheck } from '../src/api/client';
import { Button } from '../src/components/Button';
import { ButtonFooter } from '../src/components/ButtonFooter';
import { Card } from '../src/components/Card';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { ScreenScrollView } from '../src/components/ScreenScrollView';
import { colors } from '../src/theme/colors';
import { fonts } from '../src/theme/typography';

type PickedImage = {
  uri: string;
  mimeType?: string;
  fileName?: string;
};

export default function QualityScreen() {
  const insets = useSafeAreaInsets();
  const [image, setImage] = useState<PickedImage | null>(null);
  const [result, setResult] = useState<QualityCheck | null>(null);
  const [scanning, setScanning] = useState(false);
  const [saved, setSaved] = useState(false);

  async function ensureCameraPermission() {
    const current = await ImagePicker.getCameraPermissionsAsync();
    if (current.granted) return true;
    const asked = await ImagePicker.requestCameraPermissionsAsync();
    return asked.granted;
  }

  async function ensureLibraryPermission() {
    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (current.granted) return true;
    const asked = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return asked.granted;
  }

  async function takePhoto() {
    const ok = await ensureCameraPermission();
    if (!ok) {
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
    setResult(null);
    setSaved(false);
    setImage({
      uri: asset.uri,
      mimeType: asset.mimeType ?? 'image/jpeg',
      fileName: asset.fileName ?? 'coffee-scan.jpg',
    });
  }

  async function chooseFromLibrary() {
    const ok = await ensureLibraryPermission();
    if (!ok) {
      Alert.alert('Photos permission', 'Enable photo library access to select a bean image.');
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
    setResult(null);
    setSaved(false);
    setImage({
      uri: asset.uri,
      mimeType: asset.mimeType ?? 'image/jpeg',
      fileName: asset.fileName ?? 'coffee-scan.jpg',
    });
  }

  async function handleAnalyze() {
    if (!image) {
      Alert.alert('Photo needed', 'Take a photo or choose one from your library first.');
      return;
    }
    setScanning(true);
    setSaved(false);
    try {
      const check = await api.quality.scan({
        imageUri: image.uri,
        mimeType: image.mimeType,
        fileName: image.fileName,
      });
      setResult(check);
    } catch (e) {
      Alert.alert('Analysis failed', (e as Error).message);
    } finally {
      setScanning(false);
    }
  }

  function handleSave() {
    if (!result) return;
    setSaved(true);
    Alert.alert(
      'Saved',
      `${result.lotName ?? 'Harvest'} — ${result.grade} (${result.points} points) recorded.`,
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="AI Quality Check" />
      <ScreenScrollView contentContainerStyle={styles.content}>
        <Card style={styles.scanCard}>
          {scanning ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.touristPurple} />
              <Text style={styles.scanText}>Analyzing beans with AI…</Text>
            </View>
          ) : result ? (
            <View style={styles.result}>
              {image ? (
                <Image source={{ uri: image.uri }} style={styles.preview} />
              ) : null}
              <LinearGradient
                colors={[colors.farmerGreen, colors.farmerGreenDark]}
                style={styles.gradeBanner}
              >
                <Text style={styles.grade}>{result.grade}</Text>
                <Text style={styles.points}>{result.points}/100</Text>
              </LinearGradient>
              {result.summary ? (
                <Text style={styles.summary}>{result.summary}</Text>
              ) : null}
              <View style={styles.metrics}>
                {[
                  { k: 'Moisture', v: result.moistureEstimate ?? '—' },
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
            </View>
          ) : (
            <View style={styles.center}>
              {image ? (
                <Image source={{ uri: image.uri }} style={styles.preview} />
              ) : (
                <Text style={styles.placeholderEmoji}>🔬</Text>
              )}
              <Text style={styles.placeholder}>
                Photograph harvested coffee beans, then run AI grading (Gemini free tier).
              </Text>
            </View>
          )}
        </Card>

        <View style={styles.pickRow}>
          <Pressable style={styles.pickBtn} onPress={takePhoto}>
            <Text style={styles.pickLabel}>📷 Camera</Text>
          </Pressable>
          <Pressable style={styles.pickBtn} onPress={chooseFromLibrary}>
            <Text style={styles.pickLabel}>🖼️ Library</Text>
          </Pressable>
        </View>
      </ScreenScrollView>

      <ButtonFooter style={styles.footer}>
        {result ? (
          <Button
            title={saved ? 'Saved' : 'Save / Generate Receipt'}
            onPress={handleSave}
            variant="outline"
            disabled={saved}
            style={{ marginBottom: 12 }}
          />
        ) : null}
        <Button
          title={result ? 'Analyze again' : 'Analyze with AI'}
          variant="purple"
          onPress={handleAnalyze}
          loading={scanning}
          disabled={!image}
        />
      </ButtonFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lavender },
  content: { padding: 20, paddingBottom: 8 },
  scanCard: { minHeight: 280, justifyContent: 'center' },
  center: { alignItems: 'center', paddingVertical: 24 },
  scanText: {
    fontFamily: fonts.displaySemi,
    fontSize: 16,
    color: colors.navy,
    marginTop: 16,
  },
  result: { gap: 8 },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: colors.lavender,
  },
  gradeBanner: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 8,
  },
  grade: {
    fontFamily: fonts.displayExtra,
    fontSize: 36,
    color: colors.white,
  },
  points: {
    fontFamily: fonts.displayMedium,
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  summary: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textBody,
    lineHeight: 20,
    marginBottom: 8,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
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
    fontSize: 15,
    color: colors.navy,
    marginTop: 2,
  },
  rec: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  placeholderEmoji: { fontSize: 48, marginBottom: 12 },
  placeholder: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginTop: 8,
    lineHeight: 20,
  },
  pickRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  pickBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.lavender,
  },
  pickLabel: {
    fontFamily: fonts.displaySemi,
    fontSize: 14,
    color: colors.navy,
  },
  footer: {
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lavender,
  },
});
