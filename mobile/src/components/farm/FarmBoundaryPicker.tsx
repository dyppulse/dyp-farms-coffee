import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polygon, Polyline, Region } from 'react-native-maps';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import {
  AreaUnit,
  BOUNDARY_CORNERS,
  Coordinate,
  analyseBoundary,
  formatArea,
  formatPerimeter,
} from '../../utils/boundary';
import { SegmentedControl } from '../SegmentedControl';

interface FarmBoundaryPickerProps {
  /** The corners placed so far, in order. */
  points: Coordinate[];
  onChange: (points: Coordinate[]) => void;
  /** Where the map starts. */
  initialRegion: Region;
  /** Pass a new region to fly the map there (e.g. after finding the user's GPS fix). */
  focusRegion?: Region;
}

const VALID_COLOR = '#22C55E';
const INVALID_COLOR = '#EF4444';

const UNITS = [
  { key: 'ha', label: 'ha' },
  { key: 'ac', label: 'ac' },
  { key: 'm2', label: 'm²' },
];

/**
 * Crosshair-style boundary drawing: pan the map so the fixed crosshair sits on a corner
 * of the field, then press "+ Add Point". More accurate than dragging with a finger.
 * Shows live area and warns when the outline crosses itself.
 */
export function FarmBoundaryPicker({
  points,
  onChange,
  initialRegion,
  focusRegion,
}: FarmBoundaryPickerProps) {
  const mapRef = useRef<MapView>(null);
  // The point under the crosshair. A ref, not state: it changes on every map move
  // and nothing needs to re-render for it.
  const center = useRef<Coordinate>({
    latitude: initialRegion.latitude,
    longitude: initialRegion.longitude,
  });
  const [unit, setUnit] = useState<AreaUnit>('ha');

  const { areaM2, perimeterM, selfIntersecting } = useMemo(() => analyseBoundary(points), [points]);
  const color = selfIntersecting ? INVALID_COLOR : VALID_COLOR;
  const coords = points.map((p) => ({ latitude: p.latitude, longitude: p.longitude }));
  // On Android a <Polygon /> does not redraw when its coordinates change after the first draw
  // (it stays a triangle when a 4th corner is added). A key that changes with the corners and
  // colour makes it remount instead.
  const shapeKey = `${color}-${coords.map((c) => `${c.latitude},${c.longitude}`).join('|')}`;

  useEffect(() => {
    if (focusRegion) mapRef.current?.animateToRegion(focusRegion, 400);
  }, [focusRegion]);

  const full = points.length >= BOUNDARY_CORNERS;
  const addPoint = () => {
    if (!full) onChange([...points, { ...center.current }]);
  };
  const undo = () => onChange(points.slice(0, -1));
  const clear = () => onChange([]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        mapType="satellite"
        initialRegion={initialRegion}
        onRegionChangeComplete={(r) => {
          center.current = { latitude: r.latitude, longitude: r.longitude };
        }}
        toolbarEnabled={false}
      >
        {points.length >= 3 ? (
          <Polygon
            key={`polygon-${shapeKey}`}
            coordinates={coords}
            strokeColor={color}
            strokeWidth={3}
            fillColor={selfIntersecting ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}
          />
        ) : null}
        {points.length === 2 ? (
          <Polyline key={`line-${shapeKey}`} coordinates={coords} strokeColor={color} strokeWidth={3} />
        ) : null}
        {coords.map((c, i) => (
          <Marker key={i} coordinate={c} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.dot, { backgroundColor: color }]} />
          </Marker>
        ))}
      </MapView>

      {/* Fixed crosshair at the centre of the map. */}
      <View pointerEvents="none" style={styles.crosshair}>
        <View style={styles.crossH} />
        <View style={styles.crossV} />
        <View style={styles.crossCentre} />
      </View>

      {/* Floating dashboard. */}
      <View pointerEvents="box-none" style={styles.dashboard}>
        <View style={styles.dashCard}>
          <View style={styles.dashRow}>
            <View>
              <Text style={styles.dashLabel}>Area</Text>
              <Text style={styles.dashValue}>
                {points.length >= 3 && !selfIntersecting ? formatArea(areaM2, unit) : '—'}
              </Text>
            </View>
            <View>
              <Text style={styles.dashLabel}>Points</Text>
              <Text style={styles.dashValue}>
                {points.length}/{BOUNDARY_CORNERS}
              </Text>
            </View>
            <View>
              <Text style={styles.dashLabel}>Perimeter</Text>
              <Text style={styles.dashValue}>
                {points.length >= 2 ? formatPerimeter(perimeterM, unit) : '—'}
              </Text>
            </View>
            <View style={styles.unitToggle}>
              <SegmentedControl options={UNITS} value={unit} onChange={(k) => setUnit(k as AreaUnit)} />
            </View>
          </View>
          {selfIntersecting ? (
            <Text style={styles.warning}>⚠️ Intersecting lines! Fix shape.</Text>
          ) : null}
        </View>
      </View>

      {/* Bottom toolbar. */}
      <View style={styles.toolbar}>
        <Pressable style={styles.ghostBtn} onPress={clear} disabled={points.length === 0}>
          <Text style={styles.ghostText}>Clear</Text>
        </Pressable>
        <Pressable style={styles.ghostBtn} onPress={undo} disabled={points.length === 0}>
          <Text style={styles.ghostText}>Undo</Text>
        </Pressable>
        <Pressable style={[styles.addBtn, full && styles.addBtnDisabled]} onPress={addPoint} disabled={full}>
          <Text style={styles.addText}>{full ? 'All 4 points placed' : '+ Add Point'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const CROSS = 44;

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden', borderRadius: 16 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.white,
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: CROSS,
    height: CROSS,
    marginTop: -CROSS / 2,
    marginLeft: -CROSS / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossH: { position: 'absolute', width: CROSS, height: 2, backgroundColor: colors.white },
  crossV: { position: 'absolute', width: 2, height: CROSS, backgroundColor: colors.white },
  crossCentre: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFD60A',
  },
  dashboard: { position: 'absolute', top: 10, left: 10, right: 10 },
  dashCard: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dashRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dashLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted },
  dashValue: { fontFamily: fonts.display, fontSize: 15, color: colors.navy },
  unitToggle: { marginLeft: 'auto' },
  warning: {
    fontFamily: fonts.displaySemi,
    fontSize: 12,
    color: INVALID_COLOR,
    marginTop: 8,
  },
  toolbar: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    gap: 8,
  },
  ghostBtn: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostText: { fontFamily: fonts.displayMedium, fontSize: 13, color: colors.navy },
  addBtn: {
    flex: 1,
    backgroundColor: colors.farmerGreen,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addBtnDisabled: { backgroundColor: colors.textMuted },
  addText: { fontFamily: fonts.display, fontSize: 14, color: colors.white },
});
