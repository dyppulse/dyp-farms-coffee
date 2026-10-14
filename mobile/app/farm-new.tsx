import { useMemo, useState } from 'react';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiExtended } from '../src/api/client';
import { Button } from '../src/components/Button';
import { FarmBoundaryPicker } from '../src/components/farm/FarmBoundaryPicker';
import { Input } from '../src/components/Input';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { SegmentedControl } from '../src/components/SegmentedControl';
import { colors } from '../src/theme/colors';
import { fonts } from '../src/theme/typography';
import {
  BOUNDARY_CORNERS,
  Coordinate,
  analyseBoundary,
  squareMetresToHectares,
} from '../src/utils/boundary';

// Central Uganda, a sensible default center until we get a real GPS fix.
const DEFAULT_REGION: Region = {
  latitude: 0.3476,
  longitude: 32.5825,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

type Method = 'pin' | 'boundary';

const METHODS = [
  { key: 'pin', label: '📍 Drop a pin' },
  { key: 'boundary', label: '⬠ Draw boundary' },
];

export default function NewFarmScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [method, setMethod] = useState<Method>('boundary');
  // Each method keeps its own work, so switching back and forth loses nothing.
  const [pin, setPin] = useState<Coordinate | null>(null);
  const [boundary, setBoundary] = useState<Coordinate[]>([]);
  const [focusRegion, setFocusRegion] = useState<Region | undefined>();
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  const isPin = method === 'pin';
  const analysis = useMemo(() => analyseBoundary(boundary), [boundary]);

  async function useMyLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location permission needed',
          'Enable location access in Settings to capture this farm’s GPS coordinates.',
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const here = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setFocusRegion({ ...here, latitudeDelta: 0.005, longitudeDelta: 0.005 });
      // A pin lands on your position; for a boundary you walk the map to each corner instead.
      if (isPin) setPin(here);
    } catch {
      Alert.alert('Couldn’t get location', 'Make sure location services are on and try again.');
    } finally {
      setLocating(false);
    }
  }

  async function save() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give this farm a name (e.g. "North Plot").');
      return;
    }
    if (isPin && !pin) {
      Alert.alert('Drop a pin', 'Tap the map or use "Use My Location" to mark where the farm is.');
      return;
    }
    if (!isPin && boundary.length < BOUNDARY_CORNERS) {
      Alert.alert(
        'Add more points',
        `A boundary needs ${BOUNDARY_CORNERS} points. You have placed ${boundary.length}.`,
      );
      return;
    }
    if (!isPin && analysis.selfIntersecting) {
      Alert.alert('Fix the shape', 'The boundary lines cross each other. Undo or clear and redraw.');
      return;
    }

    const points = isPin ? [pin!] : boundary;
    setSaving(true);
    try {
      await apiExtended.farms.create({
        name: name.trim(),
        sizeHectares: isPin ? undefined : Number(squareMetresToHectares(analysis.areaM2).toFixed(2)),
        boundary: points.map((p) => ({ lat: p.latitude, lng: p.longitude })),
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not save this farm.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Register a Farm" />

      <View style={styles.form}>
        <Input label="Farm name" value={name} onChangeText={setName} placeholder="North Plot" />
        <SegmentedControl options={METHODS} value={method} onChange={(k) => setMethod(k as Method)} />
      </View>

      <View style={styles.mapWrap}>
        {isPin ? (
          <MapView
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            mapType="hybrid"
            initialRegion={DEFAULT_REGION}
            region={focusRegion}
            onPress={(e) => setPin(e.nativeEvent.coordinate)}
          >
            {pin ? (
              <Marker
                coordinate={pin}
                draggable
                onDragEnd={(e) => setPin(e.nativeEvent.coordinate)}
              />
            ) : null}
          </MapView>
        ) : (
          <FarmBoundaryPicker
            points={boundary}
            onChange={setBoundary}
            initialRegion={DEFAULT_REGION}
            focusRegion={focusRegion}
          />
        )}
      </View>

      <View style={styles.toolbar}>
        <Pressable style={styles.toolBtn} onPress={useMyLocation} disabled={locating}>
          {locating ? (
            <ActivityIndicator size="small" color={colors.navy} />
          ) : (
            <Text style={styles.toolBtnText}>📍 Use My Location</Text>
          )}
        </Pressable>
        {isPin ? (
          <Pressable style={styles.toolBtnGhost} onPress={() => setPin(null)} disabled={!pin}>
            <Text style={styles.toolBtnGhostText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.hint}>
        {isPin
          ? pin
            ? 'Pin placed. Drag it to adjust, or tap elsewhere to move it.'
            : 'Tap the map to drop a pin, or use your current location.'
          : 'Pan the map so the crosshair sits on a corner of your field, then tap + Add Point. Place 4 corners.'}
      </Text>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button title="Save Farm" onPress={save} loading={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  form: { paddingHorizontal: 16, gap: 12, paddingBottom: 12 },
  mapWrap: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolbar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  toolBtn: {
    flex: 1,
    backgroundColor: colors.lavender,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toolBtnText: { fontFamily: fonts.displayMedium, fontSize: 13, color: colors.navy },
  toolBtnGhost: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolBtnGhostText: { fontFamily: fonts.displayMedium, fontSize: 13, color: colors.textSecondary },
  hint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  footer: { paddingHorizontal: 16, paddingTop: 12 },
});
