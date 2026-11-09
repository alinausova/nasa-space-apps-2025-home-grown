import { describe, expect, it } from 'vitest';
import type { CropRecommendation } from '../api/types';
import { equalAreaCuts, planFor, polygonArea, projectRing, sliceBetween, spreadLabels, type Point } from './plan';

const SQUARE: Point[] = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];
// Wider at the bottom, so equal-height bands would not be equal-area.
const TRAPEZOID: Point[] = [
  { x: 4, y: 0 },
  { x: 6, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];

function crop(id: string, perM2: number): CropRecommendation {
  return { crop_id: id, crop_name: id, suitability: { yield_estimate: { yield_per_m2_kg: perM2 } } } as CropRecommendation;
}

describe('geometry', () => {
  it('measures area', () => {
    expect(polygonArea(SQUARE)).toBe(100);
  });

  it('slices between two lines', () => {
    expect(polygonArea(sliceBetween(SQUARE, 2, 5))).toBeCloseTo(30);
  });

  it('cuts into equal areas, not equal heights', () => {
    const cuts = equalAreaCuts(TRAPEZOID, 4);
    const total = polygonArea(TRAPEZOID);
    for (let i = 0; i < 4; i++) {
      expect(polygonArea(sliceBetween(TRAPEZOID, cuts[i], cuts[i + 1]))).toBeCloseTo(total / 4, 3);
    }
    // The narrow top band must be taller than the wide bottom one.
    expect(cuts[1] - cuts[0]).toBeGreaterThan(cuts[4] - cuts[3]);
  });

  it('projects a ring into the box, keeping proportions', () => {
    // ~200 m wide, ~100 m tall near the equator.
    const pts = projectRing(
      [
        [0, 0],
        [0.0018, 0],
        [0.0018, 0.0009],
        [0, 0.0009],
        [0, 0],
      ],
      100,
      100,
    );
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(100, 0);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(50, 0);
  });
});

describe('planFor', () => {
  const ring: [number, number][] = [
    [11.564, 48.1478],
    [11.5652, 48.1477],
    [11.5653, 48.1468],
    [11.5649, 48.1463],
    [11.5641, 48.1463],
    [11.564, 48.1478],
  ];

  it('plants 70% in up to four equal beds with yield per bed', () => {
    const plan = planFor(ring, 2_000, [crop('kale', 4.5), crop('cabbage', 4), crop('lettuce', 2.2), crop('spinach', 1.4), crop('extra', 1)])!;
    expect(plan.beds).toHaveLength(4);
    expect(plan.plantedM2).toBe(1_400);
    expect(plan.beds[0].areaM2).toBe(350);
    expect(plan.beds[0].yieldKg).toBeCloseTo(1_575);
    expect(plan.totalYieldKg).toBeCloseTo(350 * (4.5 + 4 + 2.2 + 1.4));
    expect(plan.beds.every((b) => b.shape.length >= 3)).toBe(true);
  });

  it('uses fewer beds when fewer crops fit', () => {
    expect(planFor(ring, 1_000, [crop('kale', 4)])!.beds).toHaveLength(1);
  });

  it('is null without crops', () => {
    expect(planFor(ring, 1_000, [])).toBeNull();
  });
});

describe('thin plots', () => {
  // ~300 m wide, ~25 m tall.
  const wide: [number, number][] = [
    [11.56, 48.146],
    [11.564, 48.146],
    [11.564, 48.14622],
    [11.56, 48.14622],
    [11.56, 48.146],
  ];
  const crops = [crop('a', 4), crop('b', 3), crop('c', 2), crop('d', 1)];

  it('cuts wide plots into side-by-side strips of equal area', () => {
    const plan = planFor(wide, 7_000, crops)!;
    expect(plan.axis).toBe('vertical');
    const areas = plan.beds.map((b) => polygonArea(b.shape));
    for (const a of areas) expect(a).toBeCloseTo(areas[0], 3);
    const centersX = plan.beds.map((b) => b.center.x);
    expect([...centersX].sort((x, y) => x - y)).toEqual(centersX);
  });

  it('keeps tall plots in stacked bands', () => {
    // ~22 m wide, ~300 m tall.
    const tall: [number, number][] = [
      [11.56, 48.146],
      [11.5603, 48.146],
      [11.5603, 48.1487],
      [11.56, 48.1487],
      [11.56, 48.146],
    ];
    expect(planFor(tall, 7_000, crops)!.axis).toBe('horizontal');
  });
});

describe('spreadLabels', () => {
  it('keeps labels apart when their beds are close together', () => {
    const ys = spreadLabels([150, 151, 152, 153], 40, 20, 270);
    for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(40);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(20);
    expect(Math.max(...ys)).toBeLessThanOrEqual(270);
  });

  it('leaves well-spaced labels where they are', () => {
    expect(spreadLabels([40, 100, 160, 220], 40, 20, 270)).toEqual([40, 100, 160, 220]);
  });

  it('stays inside the bottom edge', () => {
    const ys = spreadLabels([260, 265, 268, 270], 40, 20, 270);
    expect(Math.max(...ys)).toBeLessThanOrEqual(270);
    expect(ys).toEqual([150, 190, 230, 270]);
  });

  it('keeps the input order', () => {
    expect(spreadLabels([200, 50], 40, 20, 270)).toEqual([200, 50]);
  });
});
