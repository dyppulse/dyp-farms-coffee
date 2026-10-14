import * as turf from '@turf/turf';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export type AreaUnit = 'ha' | 'ac' | 'm2';

export interface BoundaryAnalysis {
  /** Area in square metres; 0 until there are three points, or if the lines cross. */
  areaM2: number;
  /** Boundary length in metres (the closing edge counts once there are 3+ points). */
  perimeterM: number;
  /** True when the outline crosses itself (e.g. a figure-8), so its area is meaningless. */
  selfIntersecting: boolean;
}

/** A farm boundary is four corners: enough for squares, rectangles, trapeziums and kites. */
export const BOUNDARY_CORNERS = 4;

const M2_PER_HECTARE = 10000;
const M2_PER_ACRE = 4046.8564224;
const FEET_PER_METRE = 3.280839895;
const FEET_PER_MILE = 5280;

/** GeoJSON positions are [lng, lat], and a polygon ring must end where it starts. */
const toRing = (points: Coordinate[]) => [
  ...points.map((p) => [p.longitude, p.latitude]),
  [points[0].longitude, points[0].latitude],
];

export function analyseBoundary(points: Coordinate[]): BoundaryAnalysis {
  if (points.length < 2) return { areaM2: 0, perimeterM: 0, selfIntersecting: false };

  // Two points are just a line: a length, no area.
  if (points.length === 2) {
    const line = turf.lineString(points.map((p) => [p.longitude, p.latitude]));
    return { areaM2: 0, perimeterM: turf.length(line, { units: 'meters' }), selfIntersecting: false };
  }

  const ring = toRing(points);
  const polygon = turf.polygon([ring]);
  const selfIntersecting = turf.kinks(polygon).features.length > 0;
  return {
    areaM2: selfIntersecting ? 0 : turf.area(polygon),
    perimeterM: turf.length(turf.lineString(ring), { units: 'meters' }),
    selfIntersecting,
  };
}

export function formatArea(squareMetres: number, unit: AreaUnit): string {
  switch (unit) {
    case 'ha':
      return `${(squareMetres / M2_PER_HECTARE).toFixed(2)} ha`;
    case 'ac':
      return `${(squareMetres / M2_PER_ACRE).toFixed(2)} ac`;
    case 'm2':
      return `${Math.round(squareMetres).toLocaleString('en-US')} m²`;
  }
}

/** Metric (m / km) for hectares and m², imperial (ft / mi) for acres. */
export function formatPerimeter(metres: number, unit: AreaUnit): string {
  if (unit === 'ac') {
    const feet = metres * FEET_PER_METRE;
    return feet >= FEET_PER_MILE
      ? `${(feet / FEET_PER_MILE).toFixed(2)} mi`
      : `${Math.round(feet).toLocaleString('en-US')} ft`;
  }
  return metres >= 1000 ? `${(metres / 1000).toFixed(2)} km` : `${Math.round(metres)} m`;
}

export const squareMetresToHectares = (m2: number) => m2 / M2_PER_HECTARE;
