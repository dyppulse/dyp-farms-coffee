import { useState } from 'react';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BoundaryPoint, apiExtended } from '../src/api/client';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { colors } from '../src/theme/colors';
import { fonts } from '../src/theme/typography';

const DEFAULT_REGION = {
  // Central Uganda, a sensible default center until we get a real GPS fix.
  latitude: 0.3476,
  longitude: 32.5825,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

/** Shoelace formula over an equirectangular projection — accurate enough for
 * single-farm plots (a few hectares), not for anything continent-sized. */
function polygonAreaHectares(points: BoundaryPoint[]): number {
  if (points.length < 3) return 0;
  const R = 6371000;
  const latAvg = (points.reduce((s, p) => s + p.lat, 0) / points.length) * (Math.PI / 180);
  const projected = points.map((p) => ({
    x: R * (p.lng * Math.PI / 180) * Math.cos(latAvg),
    y: R * (p.lat * Math.PI / 180),
  }));
  let sum = 0;
  for (let i = 0; i < projected.length; i++) {
    const a = projected[i];
    const b = projected[(i + 1) % projected.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum / 2) / 10000;
}

export default function NewFarmScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [points, setPoints] = useState<BoundaryPoint[]>([]);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  const area = polygonAreaHectares(points);

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
      const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setRegion({
        latitude: point.lat,
        longitude: point.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      setPoints((prev) => [...prev, point]);
    } catch {
      Alert.alert('Couldn’t get location', 'Make sure location services are on and try again.');
    } finally {
      setLocating(false);
    }
  }

  function undoLast() {
    setPoints((prev) => prev.slice(0, -1));
  }

  function clearAll() {
    setPoints([]);
  }

  async function save() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give this farm a name (e.g. "North Plot").');
      return;
    }
    if (points.length === 0) {
      Alert.alert(
        'Add a location',
        'Drop a pin with "Use My Location" or tap the map to trace the farm boundary.',
      );
      return;
    }
    setSaving(true);
    try {
      await apiExtended.farms.create({
        name: name.trim(),
        sizeHectares: area > 0 ? Number(area.toFixed(2)) : undefined,
        boundary: points,
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
      </View>

      <View style={styles.mapWrap}>
        <MapView
          style={styles.map}
          initialRegion={region}
          region={region}
          onPress={(e) =>
            setPoints((prev) => [
              ...prev,
              {
                lat: e.nativeEvent.coordinate.latitude,
                lng: e.nativeEvent.coordinate.longitude,
              },
            ])
          }
        >
          {points.length === 1 ? (
            <Marker coordinate={{ latitude: points[0].lat, longitude: points[0].lng }} />
          ) : null}
          {points.length >= 3 ? (
            <Polygon
              coordinates={points.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
              fillColor="rgba(20,83,45,0.25)"
              strokeColor={colors.farmerGreen}
              strokeWidth={2}
            />
          ) : null}
          {points.length === 2
            ? points.map((p, i) => (
                <Marker key={i} coordinate={{ latitude: p.lat, longitude: p.lng }} />
              ))
            : null}
        </MapView>
      </View>

      <View style={styles.toolbar}>
        <Pressable style={styles.toolBtn} onPress={useMyLocation} disabled={locating}>
          {locating ? (
            <ActivityIndicator size="small" color={colors.navy} />
          ) : (
            <Text style={styles.toolBtnText}>📍 Use My Location</Text>
          )}
        </Pressable>
        <Pressable style={styles.toolBtnGhost} onPress={undoLast} disabled={points.length === 0}>
          <Text style={styles.toolBtnGhostText}>Undo</Text>
        </Pressable>
        <Pressable style={styles.toolBtnGhost} onPress={clearAll} disabled={points.length === 0}>
          <Text style={styles.toolBtnGhostText}>Clear</Text>
        </Pressable>
      </View>

      <Text style={styles.hint}>
        {points.length === 0
          ? 'Tap the map to trace your farm’s boundary, or drop a single pin with "Use My Location".'
          : points.length < 3
          ? `${points.length} point${points.length > 1 ? 's' : ''} placed — add ${
              points.length === 1 ? 'more points to trace a boundary, or save as a pin' : 'one more to close the shape'
            }.`
          : `Boundary traced · ~${area.toFixed(2)} hectares`}
      </Text>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button title="Save Farm" onPress={save} loading={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  form: { paddingHorizontal: 16 },
  mapWrap: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: { flex: 1 },
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
