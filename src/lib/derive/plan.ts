import type { CropRecommendation } from '../api/types';
import type { LngLat } from './geo';

/** Share of the plot planted; the rest is paths (matches the back end's yield factor). */
export const PLANTED_SHARE = 0.7;
export const MAX_BEDS = 4;

export type Point = { x: number; y: number };

export interface Bed {
  crop: CropRecommendation;
  areaM2: number;
  yieldKg: number;
  /** Polygon of the bed in plan coordinates. */
  shape: Point[];
  /** Centre of the bed's bounding box, where its label line starts. */
  center: Point;
}

/** Beds are cut across the plot's longer side, so thin plots get strips instead of slivers. */
export type CutAxis = 'horizontal' | 'vertical';

export interface Plan {
  outline: Point[];
  beds: Bed[];
  plantedM2: number;
  totalYieldKg: number;
  width: number;
  height: number;
  axis: CutAxis;
}

/** Shoelace area (absolute) of a polygon. */
export function polygonArea(points: Point[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

/** Part of a polygon between two horizontal lines (Sutherland–Hodgman against two half-planes). */
export function sliceBetween(points: Point[], top: number, bottom: number): Point[] {
  const clip = (poly: Point[], keep: (p: Point) => boolean, y: number): Point[] => {
    const out: Point[] = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const aIn = keep(a);
      const bIn = keep(b);
      if (aIn) out.push(a);
      if (aIn !== bIn) {
        const t = (y - a.y) / (b.y - a.y);
        out.push({ x: a.x + t * (b.x - a.x), y });
      }
    }
    return out;
  };
  return clip(clip(points, (p) => p.y >= top, top), (p) => p.y <= bottom, bottom);
}

/** Projects a lng/lat ring into a box of the given size (y down), keeping proportions. */
export function projectRing(ring: LngLat[], width: number, height: number): Point[] {
  const closed = ring.length > 1 && ring[0][0] === ring.at(-1)![0] && ring[0][1] === ring.at(-1)![1];
  const corners = closed ? ring.slice(0, -1) : ring;
  const meanLat = corners.reduce((s, p) => s + p[1], 0) / corners.length;
  const kx = Math.cos((meanLat * Math.PI) / 180);
  const xs = corners.map((p) => p[0] * kx);
  const ys = corners.map((p) => -p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(...xs) - minX || 1;
  const spanY = Math.max(...ys) - minY || 1;
  const scale = Math.min(width / spanX, height / spanY);
  const offX = (width - spanX * scale) / 2;
  const offY = (height - spanY * scale) / 2;
  return corners.map((_, i) => ({ x: offX + (xs[i] - minX) * scale, y: offY + (ys[i] - minY) * scale }));
}

/** y positions that cut the polygon into `n` horizontal bands of equal area. */
export function equalAreaCuts(points: Point[], n: number): number[] {
  const ys = points.map((p) => p.y);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  const total = polygonArea(points);
  const cuts: number[] = [top];
  for (let k = 1; k < n; k++) {
    const target = (total * k) / n;
    let lo = top;
    let hi = bottom;
    for (let iter = 0; iter < 40; iter++) {
      const mid = (lo + hi) / 2;
      if (polygonArea(sliceBetween(points, top, mid)) < target) lo = mid;
      else hi = mid;
    }
    cuts.push((lo + hi) / 2);
  }
  cuts.push(bottom);
  return cuts;
}

const transpose = (points: Point[]): Point[] => points.map((p) => ({ x: p.y, y: p.x }));

function boxCenter(points: Point[]): Point {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
}

/**
 * Label positions near their ideal y, at least `gap` apart and within [min, max].
 * Keeps the input order (beds are listed in ranking order).
 */
export function spreadLabels(ideal: number[], gap: number, min: number, max: number): number[] {
  if (ideal.length === 0) return [];
  const order = ideal.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  const placed = order.map((o) => Math.max(min, o.y));
  for (let k = 1; k < placed.length; k++) placed[k] = Math.max(placed[k], placed[k - 1] + gap);
  const overflow = placed.at(-1)! - max;
  if (overflow > 0) for (let k = 0; k < placed.length; k++) placed[k] -= overflow;
  for (let k = 0; k < placed.length; k++) placed[k] = Math.max(placed[k], min + k * gap);
  const out = new Array<number>(ideal.length);
  order.forEach((o, k) => (out[o.i] = placed[k]));
  return out;
}

/**
 * Example planting plan: the top usable crops (up to four) in beds of equal area, 70% of the plot planted.
 * TODO(redesign v2): the back end returns the plan.
 */
export function planFor(
  ring: LngLat[],
  areaM2: number,
  crops: CropRecommendation[],
  { width = 150, height = 250 } = {},
): Plan | null {
  const chosen = crops.slice(0, MAX_BEDS);
  if (chosen.length === 0 || ring.length < 4) return null;

  const outline = projectRing(ring, width, height);
  const xs = outline.map((p) => p.x);
  const ys = outline.map((p) => p.y);
  const axis: CutAxis = Math.max(...xs) - Math.min(...xs) > Math.max(...ys) - Math.min(...ys) ? 'vertical' : 'horizontal';

  // Vertical strips are horizontal bands of the transposed shape.
  const working = axis === 'vertical' ? transpose(outline) : outline;
  const cuts = equalAreaCuts(working, chosen.length);
  const plantedM2 = areaM2 * PLANTED_SHARE;
  const bedM2 = plantedM2 / chosen.length;

  const beds = chosen.map((crop, i) => {
    const slice = sliceBetween(working, cuts[i], cuts[i + 1]);
    const shape = axis === 'vertical' ? transpose(slice) : slice;
    return {
      crop,
      areaM2: bedM2,
      yieldKg: crop.suitability.yield_estimate.yield_per_m2_kg * bedM2,
      shape,
      center: boxCenter(shape),
    };
  });

  return {
    outline,
    beds,
    plantedM2,
    totalYieldKg: beds.reduce((s, b) => s + b.yieldKg, 0),
    width,
    height,
    axis,
  };
}
