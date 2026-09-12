import type { BoundaryPoint } from '../api/client';

/** Shoelace formula over an equirectangular projection — accurate enough for
 * single-farm plots (a few hectares), not for anything continent-sized. */
export function polygonAreaHectares(points: BoundaryPoint[]): number {
  if (points.length < 3) return 0;
  const R = 6371000;
  const latAvg = (points.reduce((s, p) => s + p.lat, 0) / points.length) * (Math.PI / 180);
  const projected = points.map((p) => ({
    x: R * ((p.lng * Math.PI) / 180) * Math.cos(latAvg),
    y: R * ((p.lat * Math.PI) / 180),
  }));
  let sum = 0;
  for (let i = 0; i < projected.length; i++) {
    const a = projected[i];
    const b = projected[(i + 1) % projected.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum / 2) / 10000;
}
