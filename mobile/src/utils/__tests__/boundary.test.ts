import {
  BOUNDARY_CORNERS,
  Coordinate,
  analyseBoundary,
  formatArea,
  formatPerimeter,
  squareMetresToHectares,
} from '../boundary';

// A ~100 m x ~100 m square on the equator (0.0009° ≈ 100 m).
const D = 0.0009;
const square: Coordinate[] = [
  { latitude: 0, longitude: 0 },
  { latitude: 0, longitude: D },
  { latitude: D, longitude: D },
  { latitude: D, longitude: 0 },
];
// Same four corners visited in a crossing order: a figure-8 / bow-tie.
const bowTie: Coordinate[] = [square[0], square[2], square[1], square[3]];

describe('analyseBoundary', () => {
  it('measures a ~100 m square as about 1 hectare with a ~400 m perimeter', () => {
    const { areaM2, perimeterM, selfIntersecting } = analyseBoundary(square);
    expect(squareMetresToHectares(areaM2)).toBeCloseTo(1, 1);
    expect(perimeterM).toBeGreaterThan(395);
    expect(perimeterM).toBeLessThan(405);
    expect(selfIntersecting).toBe(false);
  });

  it('has no area, but a length, for two points', () => {
    const { areaM2, perimeterM } = analyseBoundary(square.slice(0, 2));
    expect(areaM2).toBe(0);
    expect(perimeterM).toBeGreaterThan(98);
    expect(perimeterM).toBeLessThan(102);
  });

  it('has nothing for zero or one point', () => {
    expect(analyseBoundary([])).toEqual({ areaM2: 0, perimeterM: 0, selfIntersecting: false });
    expect(analyseBoundary(square.slice(0, 1)).areaM2).toBe(0);
  });

  it('flags a figure-8 outline and reports no area for it', () => {
    const result = analyseBoundary(bowTie);
    expect(result.selfIntersecting).toBe(true);
    expect(result.areaM2).toBe(0);
  });

  it('does not flag a concave but valid shape', () => {
    const concave: Coordinate[] = [
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: D },
      { latitude: D, longitude: D },
      { latitude: D / 2, longitude: D / 2 },
      { latitude: D, longitude: 0 },
    ];
    expect(analyseBoundary(concave).selfIntersecting).toBe(false);
  });
});

describe('formatting', () => {
  it('formats area in each unit', () => {
    expect(formatArea(10000, 'ha')).toBe('1.00 ha');
    expect(formatArea(4046.8564224, 'ac')).toBe('1.00 ac');
    expect(formatArea(12345, 'm2')).toBe('12,345 m²');
  });

  it('formats perimeter metric for ha/m2 and imperial for acres', () => {
    expect(formatPerimeter(400, 'ha')).toBe('400 m');
    expect(formatPerimeter(1500, 'm2')).toBe('1.50 km');
    expect(formatPerimeter(100, 'ac')).toBe('328 ft');
    expect(formatPerimeter(2000, 'ac')).toBe('1.24 mi');
  });
});

describe('BOUNDARY_CORNERS', () => {
  it('is four, so a boundary can be any quadrilateral', () => {
    expect(BOUNDARY_CORNERS).toBe(4);
  });
});
